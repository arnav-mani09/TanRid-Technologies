import { Router } from "express";
import { chatWithAssistant } from "../controllers/chat";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.post("/chat", requireAuth, chatWithAssistant);

export default router;
