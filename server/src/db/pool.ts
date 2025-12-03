import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const needsSSL =
  process.env.FORCE_DB_SSL === "true" ||
  process.env.NODE_ENV === "production" ||
  (process.env.DATABASE_URL ?? "").includes("supabase.com");

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: needsSSL ? { rejectUnauthorized: false } : undefined,
});
