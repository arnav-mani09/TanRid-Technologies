import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Uncomment if you need SSL in production:
  // ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});
