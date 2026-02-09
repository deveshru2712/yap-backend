import express from "express";

import * as conversationController from "../controllers/conversation.controller";

const router = express.Router();

router.get("/recent-conversation", conversationController.recentConversation);

export default router;
