import express from "express";

import * as conversationController from "../controllers/conversation.controller";
import { zodValidator } from "../middleware/validationMiddleware";
import { verifySession } from "../middleware/verifySession";
import { createGroupConversationBodySchema } from "../schemas/conversation.schema";
import { searchQuerySchema } from "../schemas/user.schema";

const router = express.Router();

router.get(
  "/recent-conversation",
  verifySession,
  conversationController.fetchRecentConversation
);

router.get(
  "/",
  verifySession,
  zodValidator(searchQuerySchema, "query"),
  conversationController.searchConversation
);

router.post(
  "/group/create",
  verifySession,
  zodValidator(createGroupConversationBodySchema),
  conversationController.createGroupConversation
);

export default router;
