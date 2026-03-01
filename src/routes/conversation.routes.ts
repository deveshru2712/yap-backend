import express from "express";

import * as conversationController from "../controllers/conversation.controller";
import { verifySession } from "../middleware/verifySession";

const router = express.Router();

router.get(
  "/recent-conversation",
  verifySession,
  conversationController.fetchRecentConversation
);

export default router;
