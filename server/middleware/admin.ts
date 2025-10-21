import type { Request, Response, NextFunction } from "express";
import { Errors } from "../errors";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user?.id) return next(Errors.UNAUTHORIZED());
  
  const rows = await db
    .select({ role: users.empressRole })
    .from(users)
    .where(eq(users.id, req.user.id))
    .limit(1);
    
  const role = rows[0]?.role ?? "user";
  
  if (role !== "admin") {
    return next(Errors.FORBIDDEN("Admin only"));
  }
  
  return next();
}