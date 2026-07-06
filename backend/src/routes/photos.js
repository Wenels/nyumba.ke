import { Router } from "express";
import { upload, uploadPhotos, deletePhoto } from "../controllers/photosController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/:id/photos", requireAuth, upload.array("photos", 10), uploadPhotos);
router.delete("/:id/photos/:photoId", requireAuth, deletePhoto);

export default router;
