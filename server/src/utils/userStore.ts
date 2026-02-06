import fs from "fs/promises";
import path from "path";

export type UserRecord = {
  id: string;
  email: string;
  password_hash: string;
  name?: string;
  google_id?: string | null;
  reset_token?: string | null;
  reset_token_expires?: number | null;
  created_at?: string;
};

const dataDir =
  process.env.DATA_DIR ||
  (process.env.NODE_ENV === "production"
    ? "/tmp/tanrid-data"
    : path.join(process.cwd(), "data"));
const usersFile = path.join(dataDir, "users.json");

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const ensureStore = async () => {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(usersFile);
  } catch {
    await fs.writeFile(usersFile, "[]", "utf-8");
  }
};

export const readUsers = async (): Promise<UserRecord[]> => {
  await ensureStore();
  const raw = await fs.readFile(usersFile, "utf-8");
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    await fs.writeFile(usersFile, "[]", "utf-8");
    return [];
  }
};

const writeUsers = async (users: UserRecord[]) => {
  await ensureStore();
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2), "utf-8");
};

export const findUserByEmail = async (email: string) => {
  const users = await readUsers();
  const normalized = normalizeEmail(email);
  return users.find(user => normalizeEmail(user.email) === normalized) || null;
};

export const findUserById = async (id: string) => {
  const users = await readUsers();
  return users.find(user => user.id === id) || null;
};

export const createUser = async (user: UserRecord) => {
  const users = await readUsers();
  users.push(user);
  await writeUsers(users);
  return user;
};

export const updateUser = async (id: string, updates: Partial<UserRecord>) => {
  const users = await readUsers();
  const index = users.findIndex(user => user.id === id);
  if (index === -1) return null;
  const existing = users[index];
  if (!existing) return null;
  const updated: UserRecord = {
    ...existing,
    ...updates,
    id: existing.id,
    email: existing.email,
    password_hash: existing.password_hash,
  };
  users[index] = updated;
  await writeUsers(users);
  return users[index];
};
