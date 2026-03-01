import { and, desc, eq, max, ne } from "drizzle-orm";
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

    logger.info({ userId: currentUser.id }, "Fetching recent conversations");

    const latestPerConversation = db
      .select({
        conversationId: message.conversationId,
        maxCreatedAt: max(message.createdAt).as("maxCreatedAt"),
      })
      .from(message)
      .groupBy(message.conversationId)
      .as("latest");

    const otherParticipant = alias(
      conversationParticipants,
      "otherParticipant"
    );

    const result = await db
      .select({
        userId: user.id,
        conversationId: conversation.id,
        name: conversation.name,
        avatar: conversation.avatar,
        type: conversation.type,
        content: message.content,
        createdAt: message.createdAt,
      })
      .from(conversationParticipants)
      .innerJoin(
        latestPerConversation,
        eq(
          conversationParticipants.conversationId,
          latestPerConversation.conversationId
        )
      )
      .innerJoin(
        message,
        and(
          eq(message.conversationId, latestPerConversation.conversationId),
          eq(message.createdAt, latestPerConversation.maxCreatedAt)
        )
      )
      .innerJoin(conversation, eq(conversation.id, message.conversationId))
      .leftJoin(
        otherParticipant,
        and(
          eq(otherParticipant.conversationId, conversation.id),
          ne(otherParticipant.userId, currentUser.id)
        )
      )
      .leftJoin(user, eq(user.id, otherParticipant.userId))
      .where(eq(conversationParticipants.userId, currentUser.id))
      .orderBy(desc(message.createdAt))
      .limit(10);

    if (!result.length) {
      logger.info({ userId: currentUser.id }, "No recent conversations found");
      return res.status(200).json({ success: true, result: [] });
    }

    logger.info(
      { userId: currentUser.id, count: result.length },
      "Recent conversations fetched successfully"
    );

    return res.status(200).json({
      success: true,
      result,
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
