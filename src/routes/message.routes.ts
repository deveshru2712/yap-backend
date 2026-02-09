import express from "express";

import * as messageController from "../controllers/message.controller";
import { zodValidator } from "../middleware/validationMiddleware";
import { verifySession } from "../middleware/verifySession";
import {
  sendMessageBodySchema,
  sendMessageQuerySchema,
} from "../schemas/message.schema";

const router = express.Router();

router.get(
  "/",
  verifySession,
  zodValidator(sendMessageQuerySchema, "query"),
  zodValidator(sendMessageBodySchema, "body"),
  messageController.sendMessage
);

export default router;
