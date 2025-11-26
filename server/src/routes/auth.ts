import { Router } from "express";
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  getCurrentUser,
} from "../controllers/auth";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot", forgotPassword);
router.post("/reset", resetPassword);
router.get("/me", requireAuth, getCurrentUser);

export default router;
