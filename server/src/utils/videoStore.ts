import fs from "fs/promises";
import path from "path";

export type VideoRecord = {
  id: string;
  title: string;
  caption?: string;
  file_path: string;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
};

const dataDir = path.join(process.cwd(), "data");
const videosFile = path.join(dataDir, "videos.json");

const ensureStore = async () => {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(videosFile);
  } catch {
    await fs.writeFile(videosFile, "[]", "utf-8");
  }
};

const readVideos = async (): Promise<VideoRecord[]> => {
  await ensureStore();
  const raw = await fs.readFile(videosFile, "utf-8");
  const data = JSON.parse(raw);
  return Array.isArray(data) ? data : [];
};

const writeVideos = async (videos: VideoRecord[]) => {
  await ensureStore();
  await fs.writeFile(videosFile, JSON.stringify(videos, null, 2), "utf-8");
};

export const listVideoRecords = async () => {
  const videos = await readVideos();
  return videos.sort((a, b) => b.created_at.localeCompare(a.created_at));
};

export const addVideoRecord = async (video: VideoRecord) => {
  const videos = await readVideos();
  videos.push(video);
  await writeVideos(videos);
  return video;
};

export const findVideoRecord = async (id: string) => {
  const videos = await readVideos();
  return videos.find(video => video.id === id) || null;
};

export const deleteVideoRecord = async (id: string) => {
  const videos = await readVideos();
  const index = videos.findIndex(video => video.id === id);
  if (index === -1) return null;
  const [removed] = videos.splice(index, 1);
  await writeVideos(videos);
  return removed;
};
