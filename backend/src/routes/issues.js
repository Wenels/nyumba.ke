import { Router } from "express";
import { createIssue, getTenantIssues, getLandlordIssues, updateIssueStatus, uploadIssuePhotos } from "../controllers/issuesController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/", requireAuth, uploadIssuePhotos, createIssue);
router.get("/tenant", requireAuth, getTenantIssues);
router.get("/landlord", requireAuth, getLandlordIssues);
router.patch("/:id/status", requireAuth, updateIssueStatus);

export default router;
