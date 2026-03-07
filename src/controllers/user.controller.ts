import { and, eq, ilike, inArray, not } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { RequestHandler } from "express";

import db from "../db/db";
import { conversation, conversationParticipants, user } from "../db/schema";
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

    // Search users
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
        .from(conversation)
        .innerJoin(
          cpCurrent,
          and(
            eq(cpCurrent.conversationId, conversation.id),
            eq(cpCurrent.userId, currentUser.id)
          )
        )
        .innerJoin(
          cpOther,
          and(
            eq(cpOther.conversationId, conversation.id),
            inArray(
              cpOther.userId,
              users.map((u) => u.id)
            )
          )
        )
        .where(eq(conversation.type, "direct"));

      const conversationMap = new Map<string, string>();

      for (const row of directConversations) {
        conversationMap.set(row.otherUserId, row.conversationId);
      }

      resultUsers = users.map((u) => ({
        ...u,
        type: "direct",
        conversationId: conversationMap.get(u.id) ?? null,
      }));
    }

    // Search groups
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
