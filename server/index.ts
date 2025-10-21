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

const app = express();

// Trust proxy - Replit runs behind a proxy
app.set('trust proxy', 1);

// Security: HTTP headers protection with CSP
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: process.env.NODE_ENV === "production" ? {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "img-src": ["'self'", "data:", "blob:", process.env.PUBLIC_ASSET_ORIGIN ?? "'self'"],
      "media-src": ["'self'", "blob:"],
      "connect-src": ["'self'"],
      "script-src": ["'self'"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "font-src": ["'self'", "data:"],
    },
  } : false
}));

// Security: CORS configuration
app.use(cors({
  origin: process.env.CLIENT_ORIGIN ?? true,
  credentials: true,
}));

// Security: Rate limiting on authentication endpoints
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // 20 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many authentication attempts, please try again later"
});

app.use("/api/auth/", authLimiter);

// Security: Rate limiting for write operations across API
const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS",
  message: "Too many requests, please try again later"
});

app.use(["/api", "/uploads"], writeLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files
app.use('/uploads', uploadsStatic);

// Mount asset routes
app.use(assetRoutes);

// Mount public approval routes BEFORE auth middleware
import { approvalsPublicRouter } from "./routes/approvals.public";
app.use("/api/approvals/public", approvalsPublicRouter);

// Import council routes
import council from "./routes/council";

// Security: Safe metadata logging (no PII in logs)
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

// Security: Global API authentication guard (whitelist public routes)
const PUBLIC_ROUTES = new Set([
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/me",
  "/api/public/register",
  "/api/public/staff-apply",
  "/api/health"
]);

// Patterns for public routes that need wildcard matching
const PUBLIC_ROUTE_PATTERNS = [
  /^\/api\/approvals\/public\/.*/,
  /^\/api\/assets\/public\/.*/
];

app.use((req, res, next) => {
  // Skip auth for non-API routes
  if (!req.path.startsWith("/api/")) {
    return next();
  }
  
  // Check exact matches
  if (PUBLIC_ROUTES.has(req.path)) {
    console.log(`[Auth] Skipping auth for exact match: ${req.path}`);
    return next();
  }
  
  // Check pattern matches
  const isPublicPattern = PUBLIC_ROUTE_PATTERNS.some(pattern => pattern.test(req.path));
  if (isPublicPattern) {
    console.log(`[Auth] Skipping auth for pattern match: ${req.path}`);
    return next();
  }
  
  // Otherwise require auth
  console.log(`[Auth] Requiring auth for: ${req.path}`);
  return authMiddleware(req as any, res, next);
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log the error for debugging
    console.error("Error:", err);
    
    // Send error response (do not rethrow - this would crash the server)
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });

  // Schedule hourly automation runs
  cron.schedule("0 * * * *", () => {
    log("🤖 Running scheduled automations...");
    runScheduledAutomations().catch(err => {
      console.error("Error running scheduled automations:", err);
    });
  });
})();

// Export app for testing
export default app;
