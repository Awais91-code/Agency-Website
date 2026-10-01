export type ApiErrorShape = {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  requestId?: string;
};

export type ApiSuccess<T> = {
  ok: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiFailure = {
  ok: false;
  error: ApiErrorShape;
};

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;
