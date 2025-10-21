-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Optional: Tighten search_path for security
-- ALTER DATABASE current_database() SET search_path TO public;

-- Note: Drizzle will create tables from schema with `drizzle-kit push`