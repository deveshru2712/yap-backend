import express from "express";

import * as messageController from "../controllers/message.controller";
import { zodValidator } from "../middleware/validationMiddleware";
import { verifySession } from "../middleware/verifySession";
import {
  fetchMessageQuerySchema,
  sendDirectMessageBodySchema,
  sendGroupMessageBodySchema,
} from "../schemas/message.schema";

const router = express.Router();

router.get(
  "/",
  verifySession,
  zodValidator(fetchMessageQuerySchema, "query"),
  messageController.fetchMessage
);

router.post(
  "/direct",
  verifySession,
  zodValidator(sendDirectMessageBodySchema),
  messageController.sendDirectMessage
);

router.post(
  "/group",
  verifySession,
  zodValidator(sendGroupMessageBodySchema),
  messageController.sendGroupMessage
);

export default router;
