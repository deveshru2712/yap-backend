import { eq } from "drizzle-orm";
import { RequestHandler } from "express";

import db from "../db/db";
import { schema } from "../db/schema";
import { logger } from "../utils/pino";

export const recentConversation: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      logger.warn("Unauthorized access to recent conversations");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const conversations = await db
      .select()
      .from(schema.conversationParticipants)
      .innerJoin(
        schema.conversation,
        eq(
          schema.conversationParticipants.conversationId,
          schema.conversation.id
        )
      )
      .where(eq(schema.conversationParticipants.userId, req.user.id));
  } catch (error) {
    logger.error({ err: error }, "Unable to fetch recent conversation");
    next(error);
  }
};
