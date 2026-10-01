const base = (process.env.M19_SMOKE_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const attempts = Number(process.env.M19_SMOKE_ATTEMPTS || 12);
const waitMs = Number(process.env.M19_SMOKE_WAIT_MS || 5000);

const routes = [
  { path: "/api/health", kind: "json-health" },
  { path: "/", kind: "html" },
  { path: "/services", kind: "html" },
  { path: "/work", kind: "html" },
  { path: "/blog", kind: "html" },
  { path: "/start-a-project", kind: "html" },
  { path: "/robots.txt", kind: "text" },
  { path: "/sitemap.xml", kind: "text" },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function requestWithRetry(path) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(`${base}${path}`, {
        redirect: "manual",
        signal: AbortSignal.timeout(15_000),
        headers: { "user-agent": "agency-m19-smoke/1.0" },
      });

      if (response.status >= 200 && response.status < 400) return response;
      lastError = new Error(`${path} returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    if (attempt < attempts) await sleep(waitMs);
  }

  throw lastError || new Error(`${path} did not become ready.`);
}

for (const route of routes) {
  const response = await requestWithRetry(route.path);
  const text = await response.text();

  if (route.kind === "json-health") {
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error("/api/health did not return JSON.");
    }

    if (payload.status !== "ok") {
      throw new Error(`/api/health reported ${payload.status ?? "unknown"}.`);
    }

    if (JSON.stringify(payload).match(/password|secret|token|authorization|cookie/i)) {
      throw new Error("Health response appears to contain sensitive diagnostic keys.");
    }
  }

  if (route.kind === "html" && !/<!doctype html|<html/i.test(text)) {
    throw new Error(`${route.path} did not return an HTML document.`);
  }

  if (!text.trim()) throw new Error(`${route.path} returned an empty body.`);

  console.log(`PASS ${route.path} ${response.status}`);
}

console.log(`M19 post-deploy smoke test passed for ${base}.`);
