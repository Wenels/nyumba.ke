import { requireAuth } from "../middleware/auth.js";
import { Router } from "express";
import { register, login, logout, me, updateProfile, updatePassword, requestVerification } from "../controllers/authController.js";

const router = Router();

router.post("/verification/request", requireAuth, requestVerification);
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", me);

export default router;

router.patch("/profile", updateProfile);
router.patch("/password", updatePassword);
