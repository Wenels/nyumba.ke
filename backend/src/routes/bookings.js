import { Router } from "express";
import {
  createBooking,
  getTenantBookings,
  getLandlordBookings,
  getBooking,
  updateBookingStatus,
  cancelBooking,
  getAvailableUnitsForBooking,
  selectUnit,
  completeViewing,
  initiateBookingPayment,
  confirmBookingPayment,
  getIncompleteBookings,
} from "../controllers/bookingsController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.post("/", requireAuth, createBooking);

// Static routes BEFORE /:id to avoid wildcard capture
router.get("/tenant", requireAuth, getTenantBookings);
router.get("/tenant/incomplete", requireAuth, getIncompleteBookings);
router.get("/landlord", requireAuth, getLandlordBookings);

// Dynamic routes
router.get("/:id", requireAuth, getBooking);
router.get("/:id/available-units", requireAuth, getAvailableUnitsForBooking);
router.post("/:id/pay", requireAuth, initiateBookingPayment);
router.post("/:id/confirm-payment", requireAuth, confirmBookingPayment);
router.patch("/:id/select-unit", requireAuth, selectUnit);
router.patch("/:id/complete-viewing", requireAuth, completeViewing);
router.patch("/:id/status", requireRole("LANDLORD", "ADMIN"), updateBookingStatus);
router.patch("/:id/cancel", requireAuth, cancelBooking);

export default router;
