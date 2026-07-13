import { Router } from "express";
import { createBooking, getTenantBookings, getLandlordBookings, getBooking, updateBookingStatus, cancelBooking } from "../controllers/bookingsController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.post("/", requireAuth, createBooking);
router.get("/tenant", requireAuth, getTenantBookings);
router.get("/landlord", requireAuth, getLandlordBookings);
router.get("/:id", requireAuth, getBooking);
router.patch("/:id/status", requireRole("LANDLORD", "ADMIN"), updateBookingStatus);
router.patch("/:id/cancel", requireAuth, cancelBooking);

export default router;
