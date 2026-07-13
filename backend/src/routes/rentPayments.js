import { Router } from "express";
import { getTenantRentPayments, getLandlordRentPayments, payRent } from "../controllers/rentPaymentsController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/tenant", requireAuth, getTenantRentPayments);
router.get("/landlord", requireAuth, getLandlordRentPayments);
router.patch("/:id/pay", requireAuth, payRent);

export default router;
