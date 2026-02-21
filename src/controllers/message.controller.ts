import { and, count, eq, inArray } from "drizzle-orm";
import { RequestHandler } from "express";

import db from "../db/drizzle";
import {
  conversation,
  conversationParticipants,
  message,
} from "../db/schema/schema";
import { fetchMessageQuery } from "../schemas/message.schema";
import { logger } from "../utils/pino";

// export const sendMessage: RequestHandler<
//   unknown,
//   unknown,
//   sendMessageBody,
//   sendMessageQuery
// > = async (req, res, next) => {
//   try {
//     const { receiverId } = req.query;
//     const { content } = req.body;
//     const currentUser = req.user;

//     if (!currentUser) {
//       logger.error({ unauthorized: "user not loggged in" }, "user unauthorized");
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized user ",
//       });
//     }

//     const existingConversation = await db
//       .select({ conversationId: conversationParticipants.conversationId })
//       .from(conversationParticipants)
//       .innerJoin(
//         conversation,
//         eq(conversationParticipants.conversationId, conversation.id)
//       )
//       .where(
//         and(
//           inArray(conversationParticipants.userId, [
//             currentUser.id,
//             receiverId,
//           ]),
//           eq(conversation.type, "direct")
//         )
//       )
//       .groupBy(conversationParticipants.conversationId)
//       .having(eq(count(), 2));

//     let newMessage;

//     if (existingConversation.length > 0) {
//       newMessage = await db.transaction(async (tx) => {
//         const [msg] = await tx
//           .insert(message)
//           .values({
//             senderId: currentUser.id,
//             content,
//             conversationId: existingConversation[0].conversationId,
//             type: "text",
//           })
//           .returning();

//         await tx
//           .update(conversation)
//           .set({ updatedAt: new Date() })
//           .where(eq(conversation.id, existingConversation[0].conversationId));

//         return msg;
//       });

//       logger.info(
//         { conversationId: existingConversation[0].conversationId },
//         "Message sent to existing conversation"
//       );
//     } else {
//       newMessage = await db.transaction(async (tx) => {
//         const [newConversation] = await tx
//           .insert(conversation)
//           .values({ type: "direct" })
//           .returning();

//         await tx.insert(conversationParticipants).values([
//           { conversationId: newConversation.id, userId: currentUser.id },
//           { conversationId: newConversation.id, userId: receiverId },
//         ]);

//         const [msg] = await tx
//           .insert(message)
//           .values({
//             conversationId: newConversation.id,
//             senderId: currentUser.id,
//             content,
//             type: "text",
//           })
//           .returning();

//         return msg;
//       });

//       logger.info({}, "New conversation created and message sent");
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Message sent successfully",
//       data: newMessage,
//     });
//   } catch (error) {
//     logger.error({ err: error }, "Unable to send message");
//     next(error);
//   }
// };

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
      logger.warn("Unauthorized access attempt");
      return res.status(401).json({
        success: false,
        message: "User not authorized",
      });
    }

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID is required",
      });
    }

    const messages = await db
      .select({
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        createdAt: message.createdAt,
      })
      .from(message)
      .innerJoin(
        conversationParticipants,
        eq(message.conversationId, conversationParticipants.conversationId)
      )
      .where(
        and(
          eq(message.conversationId, conversationId),
          eq(conversationParticipants.userId, currentUser.id)
        )
      );

    if (!messages.length) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access this conversation",
      });
    }

    logger.info(
      { userId: currentUser.id, conversationId },
      "Messages fetched successfully"
    );

    return res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    logger.error(error, "Unable to fetch message");
    next(error);
  }
};
