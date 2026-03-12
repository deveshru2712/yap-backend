import * as cookie from "cookie";
import { eq } from "drizzle-orm";
import express from "express";
import jwt from "jsonwebtoken";
import { createServer } from "node:http";
import { Server } from "socket.io";

import { env } from "./config/env";
import db from "./db/db";
import { conversationParticipants } from "./db/schema/index";
import { logger } from "./utils/pino";

export const app = express();
export const server = createServer(app);

export const io = new Server(server, {
  cors: {
    origin: env.FRONTEND_URL,
    credentials: true,
  },
});

io.use((socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie;

    if (!cookieHeader) {
      logger.warn(
        { socketId: socket.id, ip: socket.handshake.address },
        "Socket rejected: no cookies"
      );
      return next(new Error("Authentication required"));
    }

    const cookies = cookie.parse(cookieHeader);
    const token = cookies.yap_token;

    if (!token) {
      logger.warn(
        { socketId: socket.id, ip: socket.handshake.address },
        "Socket rejected: missing token"
      );
      return next(new Error("Authentication required"));
    }

    const payload = jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;

    socket.data.user = payload;

    logger.debug(
      {
        socketId: socket.id,
        userId: payload.id,
      },
      "Socket authenticated"
    );

    next();
  } catch (err) {
    logger.warn(
      {
        socketId: socket.id,
        error: err instanceof Error ? err.message : err,
      },
      "Socket authentication failed"
    );

    next(new Error("Authentication required"));
  }
});

const onlineUserList = new Map<string, string>();
const typingStatus = new Map<string, NodeJS.Timeout>();

io.on("connection", async (socket) => {
  const user = socket.data.user;

  socket.join(`user:${user.id}`);

  onlineUserList.set(user.id, socket.id);

  io.emit("online_users", Array.from(onlineUserList.keys()));

  logger.info({ socketId: socket.id, userId: user.id }, "User connected");

  socket.on("user_typing", ({ receiverId }: { receiverId: string }) => {
    const existingTimeout = typingStatus.get(user.id);

    if (existingTimeout) clearTimeout(existingTimeout);

    // notify receiver
    io.to(`user:${receiverId}`).emit("typing", {
      userId: user.id,
    });

    const timeout = setTimeout(() => {
      io.to(`user:${receiverId}`).emit("stop_typing", {
        userId: user.id,
      });

      typingStatus.delete(user.id);
    }, 3000);

    typingStatus.set(user.id, timeout);
  });

  try {
    const conversations: ConversationRow[] = await db
      .select({
        conversationId: conversationParticipants.conversationId,
      })
      .from(conversationParticipants)
      .where(eq(conversationParticipants.userId, user.id));

    conversations.forEach((c) => {
      socket.join(`conversation:${c.conversationId}`);
    });

    logger.info(
      {
        socketId: socket.id,
        userId: user.id,
        rooms: conversations.map((c) => c.conversationId),
      },
      "User joined conversation rooms"
    );
  } catch (error) {
    logger.error(
      {
        socketId: socket.id,
        userId: user.id,
        error,
      },
      "Failed to fetch conversations"
    );
  }

  socket.on("disconnect", (reason) => {
    onlineUserList.delete(user.id);

    io.emit("online_users", Array.from(onlineUserList.keys()));

    const timeout = typingStatus.get(user.id);

    if (timeout) {
      clearTimeout(timeout);
      typingStatus.delete(user.id);
    }

    logger.info(
      {
        socketId: socket.id,
        userId: user.id,
        reason,
      },
      "User disconnected"
    );
  });
});
