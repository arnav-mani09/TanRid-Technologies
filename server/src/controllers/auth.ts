import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { z } from "zod";
import { pool } from "../db/pool";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const resetSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

export const register = async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }
  const { email, password, name } = parsed.data;

  const existing = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
  if (existing.rowCount) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const hash = await bcrypt.hash(password, 12);
  const result = await pool.query(
    "INSERT INTO users (email, password_hash, name) VALUES ($1,$2,$3) RETURNING id,email,name",
    [email, hash, name]
  );

  const token = jwt.sign({ sub: result.rows[0].id }, process.env.JWT_SECRET!, { expiresIn: "1h" });
  res.status(201).json({ user: result.rows[0], token });
};

export const login = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }
  const { email, password } = parsed.data;

  const user = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
  if (!user.rowCount) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.rows[0].password_hash);
  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ sub: user.rows[0].id }, process.env.JWT_SECRET!, { expiresIn: "1h" });
  res.json({ user: { id: user.rows[0].id, email: user.rows[0].email, name: user.rows[0].name }, token });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 15 * 60 * 1000);

  await pool.query(
    "UPDATE users SET reset_token=$1, reset_token_expires=$2 WHERE email=$3",
    [token, expires, email]
  );

  console.log(`Password reset link: https://tanrid.com/reset?token=${token}`);
  res.json({ message: "If that email exists, reset instructions were sent." });
};

export const resetPassword = async (req: Request, res: Response) => {
  const parsed = resetSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }
  const { token, password } = parsed.data;

  const user = await pool.query(
    "SELECT id FROM users WHERE reset_token=$1 AND reset_token_expires > now()",
    [token]
  );
  if (!user.rowCount) return res.status(400).json({ message: "Invalid or expired token" });

  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    "UPDATE users SET password_hash=$1, reset_token=NULL, reset_token_expires=NULL WHERE id=$2",
    [hash, user.rows[0].id]
  );

  res.json({ message: "Password updated" });
};

export const getCurrentUser = async (req: Request, res: Response) => {
  const userId = (req as any).user?.sub;
  if (!userId) return res.sendStatus(401);
  const user = await pool.query("SELECT id,email,name FROM users WHERE id=$1", [userId]);
  if (!user.rowCount) return res.sendStatus(404);
  res.json(user.rows[0]);
};
