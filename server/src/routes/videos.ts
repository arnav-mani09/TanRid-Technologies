import { Router } from "express";
import { listVideos, uploadVideo } from "../controllers/videos";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.get("/", requireAuth, listVideos);
router.post("/", requireAuth, uploadVideo);

export default router;
