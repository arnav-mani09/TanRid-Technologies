import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import authRouter from "./routes/auth";
import assistantRouter from "./routes/assistant";
import videoRouter from "./routes/videos";

dotenv.config();

const app = express();
app.set("trust proxy", true);
const allowedOrigins = (
  process.env.CLIENT_ORIGINS ||
  process.env.CLIENT_ORIGIN ||
  "http://localhost:5500"
)
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

const defaultLocalOrigins = [
  "http://127.0.0.1:5500",
  "http://127.0.0.1:5501",
  "http://localhost:5500",
  "http://localhost:5501",
  "http://[::]:5500",
  "http://[::]:5501",
];
const allowedOriginSet = new Set([...allowedOrigins, ...defaultLocalOrigins]);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOriginSet.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ extended: true, limit: "200mb" }));
const uploadsDir = path.join(process.cwd(), "uploads");
app.use("/media", express.static(uploadsDir));
app.get("/", (_req, res) => res.json({ status: "TanRid API running" }));
app.use("/auth", authRouter);
app.use("/assistant", assistantRouter);
app.use("/videos", videoRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
