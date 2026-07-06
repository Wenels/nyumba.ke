import { Router } from "express";
import {
  getListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  getMyListings,
} from "../controllers/listingsController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// Public
router.get("/", getListings);
router.get("/my", requireAuth, getMyListings);
router.get("/:slug", getListing);

// Landlord/Admin only
router.post("/", requireRole("LANDLORD", "ADMIN"), createListing);
router.patch("/:slug", requireRole("LANDLORD", "ADMIN"), updateListing);
router.delete("/:slug", requireRole("LANDLORD", "ADMIN"), deleteListing);

export default router;

