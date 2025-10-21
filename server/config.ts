import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().default("5000"),
  CLIENT_ORIGIN: z.string().url().optional(),

  DATABASE_URL: z.string().url(),

  // JWT configuration
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_SECRETS: z.string().optional(), // For rotation support
  JWT_ISS: z.string().default("rainbow-crm"),
  JWT_AUD: z.string().default("rainbow-web"),
  JWT_EXPIRES: z.string().default("7d"),
  
  // Session secret for express-session
  SESSION_SECRET: z.string().optional(),

  // Security
  CSP_ENABLE_NONCE: z.enum(["true", "false"]).optional(),
  
  // Optional AI/Integration keys
  LEONARDO_API_KEY: z.string().optional(),
  BASE_URL: z.string().url().default("http://localhost:5000"),
});

// Parse and validate environment
export const env = EnvSchema.parse(process.env);

// Handle JWT secrets (support rotation)
export const JWT_SECRETS: string[] = (() => {
  if (env.JWT_SECRETS) {
    // Multiple secrets for rotation support
    return env.JWT_SECRETS.split(",").map(s => s.trim()).filter(Boolean);
  }
  // Single secret fallback
  return [env.JWT_SECRET];
})();

// Validate the primary secret strength
if (JWT_SECRETS[0].length < 32) {
  throw new Error("Primary JWT secret is too weak; provide a strong secret (>=32 chars).");
}

// Export convenience flags
export const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";