import { Router } from "express";
import { getAmenities, upsertAmenities, getConditionReport, upsertConditionReport } from "../controllers/amenitiesController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/:listingId/amenities", getAmenities);
router.put("/:listingId/amenities", requireAuth, upsertAmenities);
router.get("/:listingId/condition", getConditionReport);
router.put("/:listingId/condition", requireAuth, upsertConditionReport);

export default router;
