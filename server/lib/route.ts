import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

export type AuthRequest = Request & { user?: { id: string; role: string } };

export function withBody<I extends z.ZodTypeAny>(
  schema: I,
  handler: (req: AuthRequest & { body: z.infer<I> }, res: Response) => Promise<any>
) {
  return async (req: any, res: any, next: NextFunction) => {
    try {
      const strictSchema = (schema as any).strict ? (schema as any).strict() : schema;
      req.body = strictSchema.parse(req.body ?? {});
      await handler(req, res);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: e.errors });
      }
      next(e);
    }
  };
}

export function withQuery<I extends z.ZodTypeAny>(
  schema: I,
  handler: (req: AuthRequest & { query: z.infer<I> }, res: Response) => Promise<any>
) {
  return async (req: any, res: any, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query ?? {});
      await handler(req, res);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: e.errors });
      }
      next(e);
    }
  };
}

export function requireOwned<T>(
  fetcher: (id: string, ownerId: string) => Promise<T | null | undefined>,
  idParam = "id"
) {
  return async (req: any, res: any, next: NextFunction) => {
    try {
      const id = req.params[idParam];
      const ownerId = req.user?.id;
      if (!ownerId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const row = await fetcher(id, ownerId);
      if (!row) {
        return res.status(404).json({ error: "Not found" });
      }
      req.owned = row;
      next();
    } catch (e) {
      next(e);
    }
  };
}
