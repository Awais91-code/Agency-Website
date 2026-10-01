export type DatabaseErrorInfo = {
  code: string;
  message: string;
  details?: string;
  hint?: string;
};

export function toDatabaseErrorInfo(error: unknown): DatabaseErrorInfo {
  if (typeof error === "object" && error !== null) {
    const candidate = error as Record<string, unknown>;

    return {
      code: typeof candidate.code === "string" ? candidate.code : "DATABASE_ERROR",
      message:
        typeof candidate.message === "string"
          ? candidate.message
          : "The database operation failed.",
      ...(typeof candidate.details === "string" ? { details: candidate.details } : {}),
      ...(typeof candidate.hint === "string" ? { hint: candidate.hint } : {}),
    };
  }

  return {
    code: "DATABASE_ERROR",
    message: error instanceof Error ? error.message : "The database operation failed.",
  };
}
