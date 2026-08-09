import { Router } from "express";
import { getTenantRentPayments, getLandlordRentPayments, initiateRentPayment, confirmRentPayment, getPaymentDetail } from "../controllers/rentPaymentsController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/tenant", requireAuth, getTenantRentPayments);
router.get("/landlord", requireAuth, getLandlordRentPayments);
router.post("/:id/pay", requireAuth, initiateRentPayment);
router.post("/:id/confirm-payment", requireAuth, confirmRentPayment);
router.get("/:id", requireAuth, getPaymentDetail);

export default router;
