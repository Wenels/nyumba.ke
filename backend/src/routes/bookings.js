import { Router } from "express";
import { createBooking, getTenantBookings, getLandlordBookings, getBooking, updateBookingStatus, cancelBooking, getAvailableUnitsForBooking, selectUnit, completeViewing } from "../controllers/bookingsController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.post("/", requireAuth, createBooking);
router.get("/tenant", requireAuth, getTenantBookings);
router.get("/landlord", requireAuth, getLandlordBookings);
router.get("/:id", requireAuth, getBooking);
router.get("/:id/available-units", requireAuth, getAvailableUnitsForBooking);
router.patch("/:id/select-unit", requireAuth, selectUnit);
router.patch("/:id/complete-viewing", requireAuth, completeViewing);
router.patch("/:id/status", requireRole("LANDLORD", "ADMIN"), updateBookingStatus);
router.patch("/:id/cancel", requireAuth, cancelBooking);

export default router;
