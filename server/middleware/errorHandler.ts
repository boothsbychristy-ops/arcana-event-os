import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../errors";
import { ZodError } from "zod";

export function asyncHandler<T extends (...a: any[]) => any>(fn: T) {
  return (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  // HttpError instances - structured errors
  if (err instanceof HttpError) {
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
    return res.status(403).json({ 
      error: { 
        code: "TOKEN_EXPIRED", 
        message: "Session expired" 
      } 
    });
  }
  
  if (err?.code === "TOKEN_INVALID" || err?.name === "JsonWebTokenError") {
    return res.status(401).json({ 
      error: { 
        code: "TOKEN_INVALID", 
        message: "Invalid token" 
      } 
    });
  }

  // Log unexpected errors
  console.error("[ServerError]", err);
  
  // Generic server error
  return res.status(500).json({ 
    error: { 
      code: "SERVER_ERROR", 
      message: "Internal Server Error" 
    } 
  });
}