import express from "express";

import * as conversationController from "../controllers/conversation.controller";
import { zodValidator } from "../middleware/validationMiddleware";
import { verifySession } from "../middleware/verifySession";
import { searchQuerySchema } from "../schemas/user.schema";

const router = express.Router();

router.get(
  "/recent-conversation",
  verifySession,
  conversationController.fetchRecentConversation
);

router.get(
  "/",
  zodValidator(searchQuerySchema, "query"),
  verifySession,
  conversationController.searchConversation
);

export default router;
