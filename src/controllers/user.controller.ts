import { and, eq, ilike, inArray, not } from "drizzle-orm";
import { RequestHandler } from "express";

import db from "../db/drizzle";
import {
  conversation,
  conversationParticipants,
  user,
} from "../db/schema/schema";
import { searchQuery } from "../schemas/user.schema";
import { logger } from "../utils/pino";

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
        id: user.id,
        name: user.username,
        avatar: user.avatar,
      })
      .from(user)
      .where(
        and(ilike(user.username, `${query}%`), not(eq(user.id, currentUser.id)))
      )
      .limit(10);

    let resultUsers = users.map((u) => ({
      ...u,
      conversationId: null as string | null,
    }));

    if (users.length > 0) {
      const directConversations = await db
        .select({
          userId: conversationParticipants.userId,
          conversationId: conversation.id,
        })
        .from(conversation)
        .innerJoin(
          conversationParticipants,
          eq(conversationParticipants.conversationId, conversation.id)
        )
        .where(
          and(
            eq(conversation.type, "direct"),
            inArray(conversationParticipants.userId, [
              currentUser.id,
              ...users.map((u) => u.id),
            ])
          )
        );

      const conversationMap = new Map<string, string>();

      for (const row of directConversations) {
        if (row.userId !== currentUser.id) {
          conversationMap.set(row.userId, row.conversationId);
        }
      }

      resultUsers = users.map((u) => ({
        ...u,
        type: "direct",
        conversationId: conversationMap.get(u.id) ?? null,
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
          ilike(conversation.name, `${query}%`)
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
        users: resultUsers,
        groups: matchingGroup,
      },
    });
  } catch (error) {
    logger.error(error, "Unable to search username");
    next(error);
  }
};
