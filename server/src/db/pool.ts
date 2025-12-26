import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || "";
const disableSsl = (process.env.FORCE_DB_SSL || "").toLowerCase() === "false";
const useSsl = !disableSsl;
const hasSslMode = /sslmode=/i.test(databaseUrl);
const normalizedUrl = useSsl && databaseUrl
  ? hasSslMode
    ? databaseUrl.replace(/sslmode=require/gi, "sslmode=no-verify")
    : `${databaseUrl}${databaseUrl.includes("?") ? "&" : "?"}sslmode=no-verify`
  : databaseUrl;
const ssl = useSsl ? { rejectUnauthorized: false } : false;

export const pool = new Pool({
  connectionString: normalizedUrl || undefined,
  ssl,
});

export default pool;
