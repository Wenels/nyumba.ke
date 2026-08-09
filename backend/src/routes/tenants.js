import { Router } from "express";
import { getTenantDetail } from "../controllers/tenantsController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/:id", requireAuth, requireRole("LANDLORD", "ADMIN"), getTenantDetail);

export default router;
