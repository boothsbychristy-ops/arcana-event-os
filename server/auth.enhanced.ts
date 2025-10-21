import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import type { Request, Response, NextFunction } from "express";
import type { User } from "@shared/schema";
import { env, JWT_SECRETS } from "./config";
import { Errors } from "./errors";

const SALT_ROUNDS = 10;

type JwtPayload = { 
  sub: string; 
  email?: string;
  role?: string; 
  iss?: string; 
  aud?: string; 
  iat?: number; 
  exp?: number;
};

export interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Sign token with current (primary) secret
function signToken(userId: string, email?: string, role?: string): string {
  return jwt.sign(
    { 
      sub: userId, 
      email, 
      role,
      iss: env.JWT_ISS, 
      aud: env.JWT_AUD 
    } as JwtPayload,
    JWT_SECRETS[0], // Always use the primary secret for signing
    { expiresIn: env.JWT_EXPIRES }
  );
}

// Verify against all known secrets (rotation-friendly)
function verifyTokenMulti(token: string): JwtPayload {
  let lastErr: any;
  
  // Try each secret in order (current first, then previous for rotation)
  for (const key of JWT_SECRETS) {
    try {
      const decoded = jwt.verify(token, key, { 
        issuer: env.JWT_ISS, 
        audience: env.JWT_AUD 
      }) as JwtPayload;
      return decoded;
    } catch (e: any) {
      lastErr = e;
      continue;
    }
  }
  
  // Map JWT errors to structured forms
  if (lastErr?.name === "TokenExpiredError") {
    throw Errors.TOKEN_EXPIRED();
  }
  throw Errors.TOKEN_INVALID();
}

export function generateToken(user: User): string {
  return signToken(user.id, user.email, user.role);
}

export function createSession(userId: string, email?: string, role?: string): string {
  return signToken(userId, email, role);
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return verifyTokenMulti(token);
  } catch (error) {
    return null;
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  
  if (!token) {
    return next(Errors.UNAUTHORIZED("Missing bearer token"));
  }

  try {
    const decoded = verifyTokenMulti(token);
    if (!decoded?.sub) {
      throw Errors.TOKEN_INVALID();
    }
    
    // Set user on request with guaranteed non-null fields
    req.user = { 
      id: decoded.sub, 
      email: decoded.email || "", 
      role: decoded.role || "user" 
    };
    
    return next();
  } catch (e: any) {
    // Pass structured errors through
    return next(e);
  }
}

export function roleMiddleware(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(Errors.UNAUTHORIZED());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(Errors.FORBIDDEN("Insufficient permissions"));
    }

    next();
  };
}

// Helper function to verify ownership of a resource
export function requireOwnership(
  resourceOwnerId: string | null | undefined, 
  currentUserId: string
): boolean {
  if (!resourceOwnerId) {
    return false;
  }
  return resourceOwnerId === currentUserId;
}