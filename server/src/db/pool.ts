import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || "";
const disableSsl = (process.env.FORCE_DB_SSL || "").toLowerCase() === "false";
const ssl =
  disableSsl
    ? false
    : {
        rejectUnauthorized: false,
      };

export const pool = new Pool({
  connectionString: databaseUrl || undefined,
  ssl,
});

export default pool;
