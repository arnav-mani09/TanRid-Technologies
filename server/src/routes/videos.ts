import { Router } from "express";
import { deleteVideo, listVideos, uploadVideo } from "../controllers/videos";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.get("/", requireAuth, listVideos);
router.post("/", requireAuth, uploadVideo);
router.delete("/:id", requireAuth, deleteVideo);

export default router;
