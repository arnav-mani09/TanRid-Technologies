import { Request, Response } from "express";
import { pool } from "../db/pool";
import fs from "fs";
import path from "path";

const uploadRoot = path.join(process.cwd(), "uploads");
const videoDir = path.join(uploadRoot, "videos");
fs.mkdirSync(videoDir, { recursive: true });

const INSTRUCTOR_EMAIL = "test@tanrid.com";

let tableReady: Promise<void> | null = null;
const ensureTable = () => {
  if (!tableReady) {
    tableReady = pool
      .query(`
        CREATE TABLE IF NOT EXISTS videos (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          caption TEXT,
          file_path TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          uploaded_by TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT now()
        )
      `)
      .then(() => undefined);
  }
  return tableReady;
};

const mapVideoRow = (row: any, baseUrl = "") => ({
  id: row.id,
  title: row.title,
  caption: row.caption,
  uploadedBy: row.uploaded_by,
  createdAt: row.created_at,
  videoUrl: `${baseUrl}/media/${row.file_path}`,
});

const getBaseUrl = (req: Request) => `${req.protocol}://${req.get("host")}`;

export const listVideos = async (req: Request, res: Response) => {
  await ensureTable();
  const { rows } = await pool.query(
    "SELECT id,title,caption,file_path,uploaded_by,created_at FROM videos ORDER BY created_at DESC"
  );
  const baseUrl = getBaseUrl(req);
  res.json(rows.map(row => mapVideoRow(row, baseUrl)));
};

const parseDataUri = (dataUri: string) => {
  const match = /^data:(.+);base64,(.+)$/.exec(dataUri);
  if (!match) {
    throw new Error("Invalid video upload format.");
  }
  const mime = match[1] ?? "video/mp4";
  const base64Data = match[2] ?? "";
  const buffer = Buffer.from(base64Data, "base64");
  return { mime, buffer };
};

const lookupEmail = async (userId: string | undefined) => {
  if (!userId) return "";
  const { rows } = await pool.query("SELECT email FROM users WHERE id=$1", [userId]);
  return rows[0]?.email || "";
};

export const uploadVideo = async (req: Request, res: Response) => {
  await ensureTable();
  const payload = (req as any).user || {};
  let userEmail = (payload.email || "") as string;
  if (!userEmail) {
    userEmail = await lookupEmail(payload.sub);
  }
  userEmail = userEmail?.toLowerCase();
  if (userEmail !== INSTRUCTOR_EMAIL.toLowerCase()) {
    return res.status(403).json({ message: "Only the TanRid instructor can upload videos." });
  }

  const { title, caption, videoData } = req.body;
  if (!title || !videoData) {
    return res.status(400).json({ message: "Title and video are required." });
  }

  try {
    if (typeof videoData !== "string") {
      return res.status(400).json({ message: "Invalid video format." });
    }
    const { mime, buffer } = parseDataUri(videoData);
    if (!mime) {
      throw new Error("Invalid video mime type.");
    }
    const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "video";
    const extension = mime.split("/")[1] || "mp4";
    const filename = `${Date.now()}-${safeTitle}.${extension}`;
    const relativePath = path.join("videos", filename);
    const destination = path.join(uploadRoot, relativePath);
    fs.writeFileSync(destination, buffer);

    const { rows } = await pool.query(
      "INSERT INTO videos (title, caption, file_path, mime_type, uploaded_by) VALUES ($1,$2,$3,$4,$5) RETURNING id,title,caption,file_path,uploaded_by,created_at",
      [title, caption, relativePath, mime, userEmail]
    );

    res.status(201).json(mapVideoRow(rows[0], getBaseUrl(req)));
  } catch (error) {
    console.error("Video upload failed", error);
    res.status(500).json({ message: "Unable to save video." });
  }
};

export const deleteVideo = async (req: Request, res: Response) => {
  await ensureTable();
  const payload = (req as any).user || {};
  let userEmail = (payload.email || "") as string;
  if (!userEmail) {
    userEmail = await lookupEmail(payload.sub);
  }
  userEmail = userEmail?.toLowerCase();
  if (userEmail !== INSTRUCTOR_EMAIL.toLowerCase()) {
    return res.status(403).json({ message: "Only the TanRid instructor can delete videos." });
  }

  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "Video id is required." });
  }

  try {
    const { rows } = await pool.query(
      "SELECT file_path FROM videos WHERE id=$1",
      [id]
    );
    const filePath = rows[0]?.file_path as string | undefined;
    await pool.query("DELETE FROM videos WHERE id=$1", [id]);
    if (filePath) {
      const target = path.join(uploadRoot, filePath);
      if (fs.existsSync(target)) {
        fs.unlinkSync(target);
      }
    }
    res.json({ ok: true });
  } catch (error) {
    console.error("Video delete failed", error);
    res.status(500).json({ message: "Unable to delete video." });
  }
};
