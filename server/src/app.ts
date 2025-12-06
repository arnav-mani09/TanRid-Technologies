import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import authRouter from "./routes/auth";
import assistantRouter from "./routes/assistant";
import videoRouter from "./routes/videos";

dotenv.config();

const app = express();
const allowedOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5500";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ extended: true, limit: "200mb" }));
app.use("/media", express.static(path.join(__dirname, "..", "uploads")));
app.get("/", (_req, res) => res.json({ status: "TanRid API running" }));
app.use("/auth", authRouter);
app.use("/assistant", assistantRouter);
app.use("/videos", videoRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
