import pino from "pino";
import pinoHttp from "pino-http";

/**
 * Production-grade logger with structured JSON output in production
 * and pretty-printed colorized output in development
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: process.env.NODE_ENV === "development"
    ? { target: "pino-pretty", options: { colorize: true } }
    : undefined,
});

/**
 * HTTP request logger middleware
 * Logs all requests with timing and status codes
 */
export const httpLogger = pinoHttp({ 
  logger,
  // Auto-generate request IDs for traceability
  genReqId: () => crypto.randomUUID(),
  // Custom log message format
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  }
});

export default logger;