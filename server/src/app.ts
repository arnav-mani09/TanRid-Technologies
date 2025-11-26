import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/auth";

dotenv.config();

const app = express();
const allowedOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5500";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

app.use(express.json());
app.get("/", (_req, res) => res.json({ status: "TanRid API running" }));
app.use("/auth", authRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
