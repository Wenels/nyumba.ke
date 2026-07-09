import { Router } from "express";
import {
  getStats,
  getUsers,
  updateUser,
  deleteUser,
  getAdminListings,
  updateListingStatus,
  deleteAdminListing,
  getReports,
  resolveReport,
  getVerifications,
  updateVerification,
} from "../controllers/adminController.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.use(requireAdmin);

router.get("/stats", getStats);

router.get("/users", getUsers);
router.patch("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

router.get("/listings", getAdminListings);
router.patch("/listings/:id/status", updateListingStatus);
router.delete("/listings/:id", deleteAdminListing);

router.get("/reports", getReports);
router.patch("/reports/:id/resolve", resolveReport);

router.get("/verifications", getVerifications);
router.patch("/verifications/:id", updateVerification);

export default router;
