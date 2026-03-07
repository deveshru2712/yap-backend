import { and, desc, eq, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { RequestHandler } from "express";

import db from "../db/db";
import {
  conversation,
  conversationParticipants,
  message,
  user,
} from "../db/schema";
import { logger } from "../utils/pino";

export const fetchRecentConversation: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const currentUser = req.user;

    if (!currentUser) {
      logger.warn("Unauthorized access to recent conversations");
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const otherParticipant = alias(
      conversationParticipants,
      "other_participant"
    );

    // DIRECT CONVERSATIONS
    const direct = await db
      .selectDistinctOn([conversation.id], {
        conversationId: conversation.id,
        messageId: message.id,
        content: message.content,
        createdAt: message.createdAt,

        receiverId: user.id,
        receiverName: user.username,
        receiverAvatar: user.avatar,
      })
      .from(conversationParticipants)

      .innerJoin(
        conversation,
        eq(conversationParticipants.conversationId, conversation.id)
      )

      .innerJoin(message, eq(message.conversationId, conversation.id))

      .innerJoin(
        otherParticipant,
        eq(otherParticipant.conversationId, conversation.id)
      )

      .innerJoin(user, eq(user.id, otherParticipant.userId))

      .where(
        and(
          eq(conversationParticipants.userId, currentUser.id),
          eq(conversation.type, "direct"),
          ne(otherParticipant.userId, currentUser.id)
        )
      )

      .orderBy(conversation.id, desc(message.createdAt))

      .limit(5);

    // GROUP CONVERSATIONS
    const group = await db
      .selectDistinctOn([conversation.id], {
        conversationId: conversation.id,
        conversationName: conversation.name,
        conversationAvatar: conversation.avatar,

        messageId: message.id,
        content: message.content,
        createdAt: message.createdAt,
      })
      .from(conversationParticipants)

      .innerJoin(
        conversation,
        eq(conversationParticipants.conversationId, conversation.id)
      )

      .innerJoin(message, eq(message.conversationId, conversation.id))

      .where(
        and(
          eq(conversationParticipants.userId, currentUser.id),
          eq(conversation.type, "group")
        )
      )

      .orderBy(conversation.id, desc(message.createdAt))

      .limit(5);

    res.status(200).json({
      success: true,
      result: {
        direct,
        group,
      },
    });
  } catch (error) {
    logger.error(
      {
        err: error,
        route: "fetchRecentConversation",
        userId: req.user?.id,
      },
      "Unable to fetch recent conversations"
    );
    next(error);
  }
};
