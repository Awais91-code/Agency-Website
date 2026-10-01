import { errorFingerprint, structuredLog } from "@/lib/observability/log";

type RequestErrorContext = {
  routerKind?: string;
  routePath?: string;
  routeType?: string;
  renderSource?: string;
};

type RequestInfo = {
  path?: string;
  method?: string;
};

export async function register() {
  structuredLog("info", "application.instrumentation_registered");
}

export function onRequestError(
  error: unknown,
  request: RequestInfo,
  context: RequestErrorContext,
) {
  structuredLog("error", "application.request_error", {
    path: request.path ?? null,
    method: request.method ?? null,
    routerKind: context.routerKind ?? null,
    routePath: context.routePath ?? null,
    routeType: context.routeType ?? null,
    renderSource: context.renderSource ?? null,
    error: errorFingerprint(error),
  });
}
