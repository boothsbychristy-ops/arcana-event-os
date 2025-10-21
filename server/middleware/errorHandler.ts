import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../errors";
import { ZodError } from "zod";
import logger from "../log";

export function asyncHandler<T extends (...a: any[]) => any>(fn: T) {
  return (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
}

/**
 * Global error handler middleware
 * Converts all errors into consistent JSON envelopes and logs them
 * Never leaks stack traces or sensitive data in production
 */
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  // Get request ID for traceability
  const reqId = (req as any).id || 'unknown';
  
  // HttpError instances - structured errors
  if (err instanceof HttpError) {
    if (err.status >= 500) {
      logger.error({ err, reqId, path: req.path }, 'Server error');
    } else if (err.status >= 400) {
      logger.warn({ err, reqId, path: req.path }, 'Client error');
    }
    
    return res.status(err.status).json({ 
      error: { 
        code: err.code, 
        message: err.message, 
        details: err.details ?? null 
      } 
    });
  }
  
  // Zod validation errors
  if (err instanceof ZodError || err?.name === "ZodError") {
    logger.warn({ err: err.issues, reqId, path: req.path }, 'Validation error');
    return res.status(400).json({ 
      error: { 
        code: "VALIDATION_ERROR", 
        message: "Invalid payload", 
        details: err.issues 
      } 
    });
  }
  
  // JWT library errors
  if (err?.code === "TOKEN_EXPIRED" || err?.name === "TokenExpiredError") {
    logger.warn({ reqId, path: req.path }, 'Token expired');
    return res.status(403).json({ 
      error: { 
        code: "TOKEN_EXPIRED", 
        message: "Session expired" 
      } 
    });
  }
  
  if (err?.code === "TOKEN_INVALID" || err?.name === "JsonWebTokenError") {
    logger.warn({ reqId, path: req.path }, 'Invalid token');
    return res.status(401).json({ 
      error: { 
        code: "TOKEN_INVALID", 
        message: "Invalid token" 
      } 
    });
  }

  // Log unexpected errors with full context
  logger.error({ err, reqId, path: req.path, method: req.method }, 'Unhandled error');
  
  // Generic server error (never leak details in production)
  return res.status(500).json({ 
    error: { 
      code: "SERVER_ERROR", 
      message: process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message || "Internal Server Error"
    } 
  });
}

/**
 * 404 handler for unmatched routes
 * Must be added after all route definitions
 */
export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "Route not found"
    }
  });
}