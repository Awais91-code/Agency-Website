import { NextResponse } from "next/server";

import type { ApiFailure, ApiSuccess } from "@/types/api";

export function apiSuccess<T>(
  data: T,
  init?: ResponseInit & { meta?: Record<string, unknown> },
) {
  const payload: ApiSuccess<T> = {
    ok: true,
    data,
    ...(init?.meta ? { meta: init.meta } : {}),
  };

  return NextResponse.json(payload, {
    ...init,
    status: init?.status ?? 200,
  });
}

export function apiFailure(
  code: string,
  message: string,
  init?: ResponseInit & {
    fieldErrors?: Record<string, string[]>;
    requestId?: string;
  },
) {
  const payload: ApiFailure = {
    ok: false,
    error: {
      code,
      message,
      ...(init?.fieldErrors ? { fieldErrors: init.fieldErrors } : {}),
      ...(init?.requestId ? { requestId: init.requestId } : {}),
    },
  };

  return NextResponse.json(payload, {
    ...init,
    status: init?.status ?? 400,
  });
}
