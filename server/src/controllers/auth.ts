import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { z } from "zod";
import { sendWelcomeEmail } from "../utils/email";
import { createUser, findUserByEmail, findUserById, readUsers, updateUser } from "../utils/userStore";

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
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not set.");
    return res.status(500).json({ message: "Server configuration error." });
  }
  const email = parsed.data.email.trim().toLowerCase();
  const { password, name } = parsed.data;

  const existing = await findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const hash = await bcrypt.hash(password, 12);
  const user = await createUser({
    id: crypto.randomUUID(),
    email,
    password_hash: hash,
    created_at: new Date().toISOString(),
    ...(name !== undefined ? { name } : {}),
  });

  try {
    await sendWelcomeEmail(email);
  } catch (error) {
    console.error("Welcome email error:", error);
  }

  const tokenPayload = { sub: user.id, email: user.email };
  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "1h" });
  res.status(201).json({ user: { id: user.id, email: user.email, name: user.name }, token });
};

export const login = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not set.");
    return res.status(500).json({ message: "Server configuration error." });
  }
  const email = parsed.data.email.trim().toLowerCase();
  const { password } = parsed.data;

  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const tokenPayload = { sub: user.id, email: user.email };
  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "1h" });
  res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });
  const normalized = String(email).trim().toLowerCase();

  const token = crypto.randomBytes(32).toString("hex");
  const expires = Date.now() + 15 * 60 * 1000;
  const user = await findUserByEmail(normalized);
  if (user) {
    await updateUser(user.id, { reset_token: token, reset_token_expires: expires });
  }

  console.log(`Password reset link: https://tanrid.com/reset?token=${token}`);
  res.json({ message: "If that email exists, reset instructions were sent." });
};

export const resetPassword = async (req: Request, res: Response) => {
  const parsed = resetSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }
  const { token, password } = parsed.data;

  const allUsers = await readUsers();
  const user = allUsers.find(
    entry => entry.reset_token === token && (entry.reset_token_expires ?? 0) > Date.now()
  );
  if (!user) return res.status(400).json({ message: "Invalid or expired token" });

  const hash = await bcrypt.hash(password, 12);
  await updateUser(user.id, { password_hash: hash, reset_token: null, reset_token_expires: null });

  res.json({ message: "Password updated" });
};

export const getCurrentUser = async (req: Request, res: Response) => {
  const userId = (req as any).user?.sub;
  if (!userId) return res.sendStatus(401);
  const user = await findUserById(userId);
  if (!user) return res.sendStatus(404);
  res.json({ id: user.id, email: user.email, name: user.name });
};
