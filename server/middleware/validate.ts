import { ZodSchema, z } from "zod";
import { Request, Response, NextFunction } from "express";

/**
 * Middleware for validating request data using Zod schemas
 * @param schema - Zod schema to validate against
 * @param pick - Which part of the request to validate (body, query, or params)
 */
export const validate = 
  (schema: ZodSchema, pick: "body" | "query" | "params" = "body") =>
  (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req[pick]);
    
    if (!parsed.success) {
      return res.status(400).json({ 
        error: { 
          code: "VALIDATION_ERROR", 
          message: "Invalid request data",
          details: parsed.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message
          }))
        }
      });
    }
    
    // Replace request data with parsed/validated data
    req[pick] = parsed.data;
    next();
  };

// Common validation schemas
export const PinSchema = z.object({
  message: z.string().min(1).max(1000).trim(),
  reason: z.enum(["logo", "color", "text", "other"]).default("other"),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  zoom: z.number().min(0.1).max(10).optional()
});

export const ShareExpirySchema = z.object({
  expiresIn: z.union([
    z.literal("24h"),
    z.literal("7d"),
    z.literal("30d"),
    z.string().datetime(),
    z.null()
  ])
});

export const ApprovalStatusSchema = z.object({
  status: z.enum(["pending", "approved", "changes_requested"]),
  feedbackNotes: z.string().max(5000).optional()
});

export const IdParamSchema = z.object({
  id: z.string().uuid()
});

export const TokenParamSchema = z.object({
  token: z.string().min(10)
});

export const UserRoleSchema = z.object({
  role: z.enum(["admin", "user"])
});

export const CoinGrantSchema = z.object({
  amount: z.number().int().min(1).max(1000)
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});