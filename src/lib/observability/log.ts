import "server-only";

import { env } from "@/config/env";

export type LogLevel = "debug" | "info" | "warn" | "error";

const redactedKey = /(password|secret|token|authorization|cookie|api[_-]?key|private[_-]?key|session|email|phone|message|requirements|objective)/i;

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 5) return "[TRUNCATED]";
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return typeof value === "string" && value.length > 500
      ? `${value.slice(0, 500)}…`
      : value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => sanitize(item, depth + 1));
  }

  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      result[key] = redactedKey.test(key)
        ? "[REDACTED]"
        : sanitize(item, depth + 1);
    }
    return result;
  }

  return String(value);
}

function threshold(level: LogLevel) {
  return { debug: 10, info: 20, warn: 30, error: 40 }[level];
}

function shouldLog(level: LogLevel) {
  return threshold(level) >= threshold(env.LOG_LEVEL);
}

/**
 * Runtime-neutral deterministic fingerprint for log grouping.
 *
 * This is intentionally non-cryptographic: it is only used to group similar
 * errors in observability output. Keeping it pure JavaScript allows the same
 * logger to be bundled for both Node.js and the Edge instrumentation runtime.
 */
function stableFingerprint(value: string) {
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  let h3 = 0x85ebca6b;

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    h1 = Math.imul(h1 ^ code, 0x01000193);
    h2 = Math.imul(h2 ^ code, 0x27d4eb2d);
    h3 = Math.imul(h3 ^ code, 0x165667b1);
  }

  const hex = (input: number) => (input >>> 0).toString(16).padStart(8, "0");
  return `${hex(h1)}${hex(h2)}${hex(h3).slice(0, 4)}`;
}

export function structuredLog(
  level: LogLevel,
  event: string,
  fields: Record<string, unknown> = {},
) {
  if (!shouldLog(level)) return;

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    service: env.NEXT_PUBLIC_APP_NAME,
    environment: env.NODE_ENV,
    release: env.APP_RELEASE ?? null,
    ...(sanitize(fields) as Record<string, unknown>),
  };

  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else if (level === "debug") console.debug(line);
  else console.info(line);
}

export function errorFingerprint(error: unknown) {
  if (!(error instanceof Error)) {
    return {
      name: "UnknownError",
      stackHash: stableFingerprint(String(error)),
    };
  }

  const stackSource = error.stack || `${error.name}:${error.message}`;
  const details: Record<string, unknown> = {
    name: error.name,
    stackHash: stableFingerprint(stackSource),
  };

  if (env.NODE_ENV !== "production") {
    details.message = error.message;
    details.stack = error.stack;
  }

  const digest = (error as Error & { digest?: string }).digest;
  if (digest) details.digest = digest;

  return details;
}
