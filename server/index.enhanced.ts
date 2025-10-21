import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cron from "node-cron";
import { runScheduledAutomations } from "./agents/scheduler";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import { uploadsStatic } from "./uploads";
import assetRoutes from "./routes.assets";
import { authMiddleware } from "./auth";
import { env, isProduction, isDevelopment } from "./config";
import { errorHandler } from "./middleware/errorHandler";
import { Errors } from "./errors";

const app = express();

// Trust proxy - Replit runs behind a proxy
app.set('trust proxy', 1);

// Security: HTTP headers protection with CSP
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: isProduction ? {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "img-src": ["'self'", "data:", "blob:"],
      "media-src": ["'self'", "blob:"],
      "connect-src": ["'self'", env.CLIENT_ORIGIN || "http://localhost:5173"],
      "script-src": ["'self'"],
      // In production, avoid unsafe-inline for better security
      "style-src": isProduction ? ["'self'"] : ["'self'", "'unsafe-inline'"],
      "font-src": ["'self'", "data:"],
      "frame-ancestors": ["'none'"],
    },
  } : false
}));

// Security: CORS configuration (tighten in production)
app.use(cors({
  origin: isProduction 
    ? (env.CLIENT_ORIGIN || false)
    : true,
  credentials: true,
}));

// Security: Rate limiting on authentication endpoints (stricter)
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Reduced from 20 to 10 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => next(Errors.RATE_LIMITED()),
});

app.use("/api/auth/", authLimiter);

// Security: Rate limiting for write operations across API
const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // General write limit
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS",
  handler: (_req, _res, next) => next(Errors.RATE_LIMITED()),
});

// Targeted read limiter for expensive/scrapeable endpoints
const readLimiterTight = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Tighter limit on heavy GETs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => next(Errors.RATE_LIMITED()),
});

// Public endpoint limiter
const publicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Very tight for public routes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => next(Errors.RATE_LIMITED()),
});

// Apply rate limits
app.use(["/api"], writeLimiter);
app.use(["/api/approvals/public", "/uploads/public"], publicLimiter);
app.use(["/api/analytics/events", "/api/boards", "/api/tasks"], readLimiterTight);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Serve uploaded files
app.use('/uploads', uploadsStatic);

// Mount asset routes
app.use(assetRoutes);

// Security: Safe metadata logging (no PII in logs)
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api") && isDevelopment) {
      log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

// Security: Global API authentication guard (expanded whitelist for public routes)
const PUBLIC_ROUTES = new Set([
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/me",
  "/api/public/register",
  "/api/public/staff-apply",
  "/api/health", // Health check
]);

// Also allow public approval routes
const PUBLIC_ROUTE_PATTERNS = [
  /^\/api\/approvals\/public\/.*/,
  /^\/api\/assets\/public\/.*/,
];

app.use((req, res, next) => {
  // Check if this is an API route that needs auth
  if (req.path.startsWith("/api/")) {
    // Check whitelist
    if (PUBLIC_ROUTES.has(req.path)) {
      return next();
    }
    
    // Check patterns
    const isPublicPattern = PUBLIC_ROUTE_PATTERNS.some(pattern => pattern.test(req.path));
    if (isPublicPattern) {
      return next();
    }
    
    // Otherwise require auth
    return authMiddleware(req as any, res, next);
  }
  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Use the structured error handler (must be after routes)
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (isDevelopment) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  const port = parseInt(env.PORT, 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`🚀 Rainbow CRM serving on port ${port} (${env.NODE_ENV} mode)`);
  });

  // Schedule hourly automation runs
  cron.schedule("0 * * * *", () => {
    log("🤖 Running scheduled automations...");
    runScheduledAutomations().catch(err => {
      console.error("Error running scheduled automations:", err);
    });
  });
  
  // Health check endpoint
  app.get("/api/health", async (_req, res) => {
    try {
      const { db } = await import("./db");
      const { sql } = await import("drizzle-orm");
      await db.execute(sql`SELECT 1`);
      res.json({ ok: true, environment: env.NODE_ENV });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });
})();

// Export app for testing
export default app;