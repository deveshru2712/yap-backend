import * as cookie from "cookie";
import express from "express";
import jwt from "jsonwebtoken";
import { createServer } from "node:http";
import { Server } from "socket.io";

import { env } from "./config/env";
import { logger } from "./utils/pino";

export const app = express();
// creating an http server
export const server = createServer(app);

export const io = new Server(server, {
  cors: {
    origin: env.FRONTEND_URL,
    credentials: true,
  },
});

// Socket authentication middleware
io.use((socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie;

    if (!cookieHeader) {
      logger.warn(
        { socketId: socket.id, ip: socket.handshake.address },
        "Socket connection rejected: no cookies"
      );
      return next(new Error("Authentication required"));
    }

    const cookies = cookie.parse(cookieHeader);
    const token = cookies.yap_token;

    if (!token) {
      logger.warn(
        { socketId: socket.id, ip: socket.handshake.address },
        "Socket connection rejected: missing yap_token"
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

io.on("connection", (socket) => {
  logger.info(
    {
      socketId: socket.id,
      userId: socket.data.user.id,
    },
    "User connected via socket"
  );

  socket.on("msg", (data) => {
    logger.info(
      {
        senderId: data.senderId,
        content: data.content,
      },
      "Message send"
    );
  });

  socket.on("disconnect", (reason) => {
    logger.info(
      {
        socketId: socket.id,
        userId: socket.data.user.id,
        reason,
      },
      "User disconnected from socket"
    );
  });
});
