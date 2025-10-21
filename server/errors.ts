export class HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, code: string, message?: string, details?: unknown) {
    super(message || code);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const Errors = {
  UNAUTHORIZED: (msg = "Unauthorized") => new HttpError(401, "UNAUTHORIZED", msg),
  FORBIDDEN: (msg = "Forbidden") => new HttpError(403, "FORBIDDEN", msg),
  BAD_REQUEST: (msg = "Bad request", details?: unknown) => new HttpError(400, "BAD_REQUEST", msg, details),
  NOT_FOUND: (msg = "Not found") => new HttpError(404, "NOT_FOUND", msg),
  CONFLICT: (msg = "Resource conflict") => new HttpError(409, "CONFLICT", msg),
  RATE_LIMITED: () => new HttpError(429, "RATE_LIMITED", "Too many requests"),
  SERVER: (msg = "Internal Server Error") => new HttpError(500, "SERVER_ERROR", msg),
  SERVICE_UNAVAILABLE: () => new HttpError(503, "SERVICE_UNAVAILABLE", "Service temporarily unavailable"),
  VALIDATION: (details?: unknown) => new HttpError(400, "VALIDATION_ERROR", "Validation failed", details),
  TOKEN_EXPIRED: () => new HttpError(403, "TOKEN_EXPIRED", "Session expired"),
  TOKEN_INVALID: () => new HttpError(401, "TOKEN_INVALID", "Invalid token"),
};