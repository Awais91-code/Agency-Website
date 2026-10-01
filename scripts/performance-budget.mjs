const base = (process.env.M19_SMOKE_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const maxResponseMs = Number(process.env.PERF_MAX_RESPONSE_MS || 2500);
const maxHtmlKb = Number(process.env.PERF_MAX_HTML_KB || 700);
const routes = ["/", "/services", "/work", "/blog", "/start-a-project"];

let failed = false;

for (const path of routes) {
  const started = performance.now();
  const response = await fetch(`${base}${path}`, {
    headers: { "user-agent": "agency-m19-performance/1.0" },
    signal: AbortSignal.timeout(Math.max(10_000, maxResponseMs * 4)),
  });
  const body = await response.arrayBuffer();
  const elapsed = Math.round(performance.now() - started);
  const sizeKb = Math.round((body.byteLength / 1024) * 10) / 10;

  const ok = response.ok && elapsed <= maxResponseMs && sizeKb <= maxHtmlKb;
  console.log(`${ok ? "PASS" : "FAIL"} ${path} status=${response.status} responseMs=${elapsed} htmlKb=${sizeKb}`);

  if (!ok) failed = true;
}

if (failed) {
  console.error(`M19 performance budget failed. Limits: ${maxResponseMs}ms response, ${maxHtmlKb}KB HTML.`);
  process.exit(1);
}

console.log("M19 lightweight performance regression budget passed.");
