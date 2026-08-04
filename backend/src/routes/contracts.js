import { Router } from "express";
import { getTenantContracts, getLandlordContracts, getContract, prepareContract, signContract, initiateInitialRentPayment, confirmInitialRentPayment } from "../controllers/contractsController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/tenant", requireAuth, getTenantContracts);
router.get("/landlord", requireAuth, getLandlordContracts);
router.get("/:id", requireAuth, getContract);
router.post("/prepare", requireRole("LANDLORD", "ADMIN"), prepareContract);
router.patch("/:id/sign", requireAuth, signContract);
router.post("/:id/pay-initial", requireAuth, initiateInitialRentPayment);
router.post("/:id/confirm-payment", requireAuth, confirmInitialRentPayment);

export default router;
