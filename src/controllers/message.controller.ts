import { and, count, eq, inArray } from "drizzle-orm";
import { RequestHandler } from "express";

import db from "../db/db";
import {
  conversation,
  conversationParticipants,
  message,
  user,
} from "../db/schema";
import {
  fetchMessageQuery,
  sendDirectMessageBody,
  sendGroupMessageBody,
} from "../schemas/message.schema";
import { emitDirectMessage } from "../socket/emitDirectMessage";
import { emitGroupMessage } from "../socket/emitGroupMessage";
import { logger } from "../utils/pino";

export const sendDirectMessage: RequestHandler<
  unknown,
  unknown,
  sendDirectMessageBody,
  unknown
> = async (req, res, next) => {
  try {
    const currentUser = req.user;
    const { content, receiverId, conversationId, clientMessageId } = req.body;

    if (!currentUser) {
      logger.warn("Unauthorized direct message attempt");
      return res.status(401).json({
        success: false,
        message: "User not authorized",
        clientMessageId,
      });
    }

    if (!content || content.trim() === "") {
      logger.warn({ userId: currentUser.id }, "Empty message content rejected");
      return res.status(400).json({
        success: false,
        message: "Message content required",
        clientMessageId,
      });
    }

    // Fetch receiver info once
    const [receiver] = await db
      .select({
        id: user.id,
        name: user.username,
        avatar: user.avatar,
      })
      .from(user)
      .where(eq(user.id, receiverId))
      .limit(1);

    if (!receiver) {
      logger.warn({ userId: currentUser.id, receiverId }, "Receiver not found");
      return res.status(404).json({
        success: false,
        message: "Receiver not found",
        clientMessageId,
      });
    }

    if (receiverId === currentUser.id) {
      logger.warn(
        { userId: currentUser.id },
        "User attempted to message themselves"
      );
      return res.status(400).json({
        success: false,
        message: "Cannot send message to yourself",
        clientMessageId,
      });
    }

    if (!conversationId) {
      let createdMessage!: {
        id: string;
        conversationId: string;
        senderId: string;
        content: string;
        createdAt: Date;
      };

      let finalConversationId!: string;

      await db.transaction(async (tx) => {
        const existingConversation = await tx
          .select({ conversationId: conversation.id })
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
                receiverId,
              ])
            )
          )
          .groupBy(conversation.id)
          .having(eq(count(), 2));

        if (existingConversation.length > 0) {
          finalConversationId = existingConversation[0].conversationId;
        } else {
          const [newConversation] = await tx
            .insert(conversation)
            .values({
              avatar: receiver.avatar,
              name: receiver.name,
              type: "direct",
            })
            .returning({ id: conversation.id });

          finalConversationId = newConversation.id;

          await tx.insert(conversationParticipants).values([
            {
              conversationId: finalConversationId,
              userId: receiverId,
            },
            {
              conversationId: finalConversationId,
              userId: currentUser.id,
            },
          ]);

          logger.info(
            {
              userId: currentUser.id,
              receiverId,
              conversationId: finalConversationId,
            },
            "Direct conversation created"
          );
        }

        const [newMessage] = await tx
          .insert(message)
          .values({
            conversationId: finalConversationId,
            senderId: currentUser.id,
            content,
          })
          .returning({
            id: message.id,
            conversationId: message.conversationId,
            senderId: message.senderId,
            content: message.content,
            createdAt: message.createdAt,
          });

        createdMessage = newMessage;

        logger.info(
          {
            userId: currentUser.id,
            conversationId: finalConversationId,
            messageId: newMessage.id,
          },
          "Direct message sent"
        );
      });

      emitDirectMessage({
        ...createdMessage,
        receiverId,
        senderUserName: currentUser.username,
        name: receiver.name,
        avatar: receiver.avatar,
        type: "direct",
      });

      return res.status(201).json({
        success: true,
        result: { ...createdMessage, clientMessageId },
      });
    }

    const participant = await db
      .select({ id: conversationParticipants.id })
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, currentUser.id)
        )
      )
      .limit(1);

    if (participant.length === 0) {
      logger.warn(
        { userId: currentUser.id, conversationId },
        "Unauthorized conversation access attempt"
      );
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
        clientMessageId,
      });
    }

    const [newMessage] = await db
      .insert(message)
      .values({
        conversationId,
        content,
        senderId: currentUser.id,
      })
      .returning({
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        content: message.content,
        createdAt: message.createdAt,
      });

    logger.info(
      {
        userId: currentUser.id,
        conversationId,
        messageId: newMessage.id,
      },
      "Direct message sent"
    );

    emitDirectMessage({
      ...newMessage,
      receiverId,
      senderUserName: currentUser.username,
      name: receiver.name,
      avatar: receiver.avatar,
      type: "direct",
    });

    return res.status(201).json({
      success: true,
      result: { ...newMessage, clientMessageId },
    });
  } catch (error) {
    logger.error(
      { userId: req.user?.id, err: error },
      "Failed to send direct message"
    );
    next(error);
  }
};

export const fetchMessage: RequestHandler<
  unknown,
  unknown,
  unknown,
  fetchMessageQuery
> = async (req, res, next) => {
  try {
    const { conversationId } = req.query;
    const currentUser = req.user;

    if (!currentUser) {
      logger.warn("Unauthorized fetch message attempt");
      return res.status(401).json({
        success: false,
        message: "User not authorized",
        result: [],
      });
    }

    if (!conversationId) {
      logger.warn(
        { userId: currentUser.id },
        "Conversation ID missing in fetch request"
      );

      return res.status(400).json({
        success: false,
        message: "Conversation ID is required",
        result: [],
      });
    }

    const result = await db
      .select({
        conversationId: conversation.id,
        type: conversation.type,
        messageId: message.id,
        senderId: message.senderId,
        username: user.username,
        content: message.content,
        createdAt: message.createdAt,
      })
      .from(conversation)

      // ensure current user is a participant
      .innerJoin(
        conversationParticipants,
        and(
          eq(conversationParticipants.conversationId, conversation.id),
          eq(conversationParticipants.userId, currentUser.id)
        )
      )

      // messages may or may not exist
      .leftJoin(message, eq(message.conversationId, conversation.id))

      // join users to get sender username
      .leftJoin(user, eq(user.id, message.senderId))

      .where(eq(conversation.id, conversationId))
      .orderBy(message.createdAt);

    if (!result.length) {
      logger.warn(
        { userId: currentUser.id, conversationId },
        "Access denied or conversation not found"
      );

      return res.status(403).json({
        success: false,
        message: "You are not allowed to access this conversation",
        result: [],
      });
    }

    const messages = result
      .filter((row) => row.messageId !== null)
      .map((row) => ({
        id: row.messageId,
        senderId: row.senderId,
        senderUsername: row.username,
        content: row.content,
        createdAt: row.createdAt,
        conversationId: row.conversationId,
      }));

    logger.info(
      {
        userId: currentUser.id,
        conversationId,
        messageCount: messages.length,
      },
      "Messages fetched successfully"
    );

    return res.status(200).json({
      success: true,
      result: messages,
    });
  } catch (error) {
    logger.error(
      { userId: req.user?.id, err: error },
      "Failed to fetch messages"
    );
    next(error);
  }
};

export const sendGroupMessage: RequestHandler<
  unknown,
  unknown,
  sendGroupMessageBody,
  unknown
> = async (req, res, next) => {
  try {
    const currentUser = req.user;

    if (!currentUser?.id) {
      logger.warn("User unauthorized");
      return res.status(401).json({
        success: false,
        message: "User not authorized",
      });
    }

    const { conversationId, content, clientMessageId } = req.body;

    if (!conversationId || !content || !clientMessageId) {
      return res.status(400).json({
        success: false,
        message: "Invalid data",
      });
    }

    // Check membership
    const existingConversation = await db
      .select({
        name: conversation.name,
        type: conversation.type,
      })
      .from(conversation)
      .innerJoin(
        conversationParticipants,
        eq(conversation.id, conversationParticipants.conversationId)
      )
      .where(
        and(
          eq(conversation.id, conversationId),
          eq(conversationParticipants.userId, currentUser.id)
        )
      )
      .limit(1);

    if (!existingConversation.length) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this conversation",
      });
    }

    const conv = existingConversation[0];

    // Ensure this endpoint only handles groups
    if (conv.type !== "group" || !conv.name) {
      return res.status(400).json({
        success: false,
        message: "Invalid group conversation",
      });
    }

    const inserted = await db
      .insert(message)
      .values({
        content,
        conversationId,
        senderId: currentUser.id,
      })
      .returning({
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
      });

    const newMessage = inserted[0];

    if (!newMessage) {
      throw new Error("Message insert failed");
    }

    const payload: GroupMessagePayload = {
      id: newMessage.id,
      content: newMessage.content,
      createdAt: newMessage.createdAt,
      senderId: currentUser.id,
      senderUserName: currentUser.username,
      avatar: null,
      conversationId,
      name: conv.name,
      type: "group",
    };

    emitGroupMessage(payload);

    return res.status(201).json({
      success: true,
      result: { ...payload, clientMessageId },
    });
  } catch (error) {
    logger.error(
      { userId: req.user?.id, err: error },
      "Failed to send group message"
    );
    next(error);
  }
};
