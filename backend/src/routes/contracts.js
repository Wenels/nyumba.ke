import { Router } from "express";
import { getTenantContracts, getLandlordContracts, getContract, prepareContract, signContract, payInitialContract } from "../controllers/contractsController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/tenant", requireAuth, getTenantContracts);
router.get("/landlord", requireAuth, getLandlordContracts);
router.get("/:id", requireAuth, getContract);
router.post("/prepare", requireRole("LANDLORD", "ADMIN"), prepareContract);
router.patch("/:id/sign", requireAuth, signContract);
router.post("/:id/pay-initial", requireAuth, payInitialContract);

export default router;
