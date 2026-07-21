import { Router } from "express";
import multer from "multer";
import path from "path";
import { requireAuth } from "../middleware/auth.js";
import {
  register,
  login,
  logout,
  me,
  updateProfile,
  updatePassword,
  requestVerification,
  uploadVerificationDocs,
} from "../controllers/authController.js";

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `doc-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", me);
router.patch("/profile", requireAuth, updateProfile);
router.patch("/password", requireAuth, updatePassword);
router.post("/verification/request", requireAuth, requestVerification);
router.post("/verification/docs", requireAuth, upload.array("docs", 5), uploadVerificationDocs);

export default router;
