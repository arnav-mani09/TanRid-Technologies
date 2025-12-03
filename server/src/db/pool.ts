import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

// Always enable SSL for Supabase/Render, but skip cert validation
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // <-- REQUIRED on Render + Supabase
  }
});

export default pool;
