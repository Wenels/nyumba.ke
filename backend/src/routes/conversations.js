import { Router } from "express";
import {
  getConversations,
  getConversation,
  startConversation,
  sendMessage,
  getUnreadCount,
} from "../controllers/conversationsController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, getConversations);
router.get("/unread", requireAuth, getUnreadCount);
router.get("/:id", requireAuth, getConversation);
router.post("/", requireAuth, startConversation);
router.post("/:id/messages", requireAuth, sendMessage);

export default router;
