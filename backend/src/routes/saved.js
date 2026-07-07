import { Router } from "express";
import { getSaved, saveListing, unsaveListing, checkSaved } from "../controllers/savedController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, getSaved);
router.get("/:listingId/check", requireAuth, checkSaved);
router.post("/:listingId", requireAuth, saveListing);
router.delete("/:listingId", requireAuth, unsaveListing);

export default router;
