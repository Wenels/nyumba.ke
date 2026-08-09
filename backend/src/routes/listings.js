import { Router } from "express";
import {
  getListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  getMyListings,
  reportListing,
  joinWaitlist,
  getLandlordWaitlist,
  getLandlordPropertyDetail,
} from "../controllers/listingsController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", getListings);
router.get("/my", requireAuth, getMyListings);
router.get("/waitlist/landlord", requireAuth, requireRole("LANDLORD", "ADMIN"), getLandlordWaitlist);
router.get("/landlord/:slug", requireAuth, requireRole("LANDLORD", "ADMIN"), getLandlordPropertyDetail);
router.get("/:slug", getListing);
router.post("/", requireRole("LANDLORD", "ADMIN"), createListing);
router.patch("/:slug", requireRole("LANDLORD", "ADMIN"), updateListing);
router.delete("/:slug", requireRole("LANDLORD", "ADMIN"), deleteListing);
router.post("/:id/report", requireAuth, reportListing);
router.post("/:id/waitlist", requireAuth, joinWaitlist);

export default router;
