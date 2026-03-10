import { and, desc, eq, ilike, inArray, ne, not } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { RequestHandler } from "express";

import db from "../db/db";
import {
  conversation,
  conversationParticipants,
  message,
  user,
} from "../db/schema";
import { searchQuery } from "../schemas/user.schema";
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
        latestMessage: message.content,
        createdAt: message.createdAt,

        userId: user.id,
        name: user.username,
        avatar: user.avatar,
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
        name: conversation.name,
        avatar: conversation.avatar,
        latestMessage: message.content,
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

export const searchConversation: RequestHandler<
  unknown,
  unknown,
  unknown,
  searchQuery
> = async (req, res, next) => {
  try {
    const { query } = req.query;
    const currentUser = req.user;

    if (!currentUser) {
      logger.warn("Unauthorized search attempt");
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const users = await db
      .select({
        userId: user.id,
        name: user.username,
        avatar: user.avatar,
      })
      .from(user)
      .where(
        and(
          ilike(user.username, `%${query}%`),
          not(eq(user.id, currentUser.id))
        )
      )
      .limit(10);

    let resultUsers = users.map((u) => ({
      ...u,
      type: "direct",
      conversationId: null as string | null,
    }));

    if (users.length > 0) {
      const cpOther = alias(conversationParticipants, "cp_other");
      const cpCurrent = alias(conversationParticipants, "cp_current");

      const directConversations = await db
        .select({
          otherUserId: cpOther.userId,
          conversationId: conversation.id,
        })
        .from(cpOther)
        .innerJoin(
          cpCurrent,
          and(
            eq(cpCurrent.conversationId, cpOther.conversationId),
            eq(cpCurrent.userId, currentUser.id)
          )
        )
        .innerJoin(
          conversation,
          and(
            eq(conversation.id, cpOther.conversationId),
            eq(conversation.type, "direct")
          )
        )
        .where(
          and(
            inArray(
              cpOther.userId,
              users.map((u) => u.userId)
            ),
            not(eq(cpOther.userId, currentUser.id))
          )
        );

      const conversationMap = new Map<string, string>();

      for (const row of directConversations) {
        if (!conversationMap.has(row.otherUserId)) {
          conversationMap.set(row.otherUserId, row.conversationId);
        }
      }

      resultUsers = users.map((u) => ({
        ...u,
        type: "direct",
        conversationId: conversationMap.get(u.userId) ?? null,
      }));
    }

    const matchingGroup = await db
      .select({
        name: conversation.name,
        avatar: conversation.avatar,
        type: conversation.type,
        conversationId: conversation.id,
      })
      .from(conversation)
      .innerJoin(
        conversationParticipants,
        eq(conversationParticipants.conversationId, conversation.id)
      )
      .where(
        and(
          eq(conversation.type, "group"),
          eq(conversationParticipants.userId, currentUser.id),
          ilike(conversation.name, `%${query}%`)
        )
      )
      .limit(10);

    logger.info(
      { userId: currentUser.id, query },
      "Search results fetched successfully"
    );

    return res.status(200).json({
      success: true,
      result: {
        direct: resultUsers,
        groups: matchingGroup,
      },
    });
  } catch (error) {
    logger.error(error, "Unable to search username");
    next(error);
  }
};
