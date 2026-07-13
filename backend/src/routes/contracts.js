import { Router } from "express";
import { getTenantContracts, getLandlordContracts, getContract, signContract } from "../controllers/contractsController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/tenant", requireAuth, getTenantContracts);
router.get("/landlord", requireAuth, getLandlordContracts);
router.get("/:id", requireAuth, getContract);
router.patch("/:id/sign", requireAuth, signContract);

export default router;
