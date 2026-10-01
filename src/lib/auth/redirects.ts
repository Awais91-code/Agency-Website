export function safeInternalPath(value: string | null | undefined, fallback = "/portal") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  try {
    const url = new URL(value, "http://local.invalid");
    if (url.origin !== "http://local.invalid") {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
