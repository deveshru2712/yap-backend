import cookieParser from "cookie-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { pinoHttp } from "pino-http";
import z from "zod";

import { env } from "./config/env";
import authRouter from "./routes/auth.routes";
import messageRouter from "./routes/message.routes";
import userRouter from "./routes/user.routes";
import { app, server } from "./socket";
import { logger } from "./utils/pino";
import { formatZodError } from "./utils/zodErrorFormatter";

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(
  pinoHttp({
    logger,
    customProps: (req, res) => ({
      // Add custom fields if needed
    }),
    serializers: {
      req: (req) => ({
        id: req.id,
        method: req.method,
        url: req.url,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },
    // Don't log certain routes
    autoLogging: {
      // ignore: (req) => req.url === "/health",
    },
  })
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Your routes will go here
app.use("/v1/api/auth", authRouter);
app.use("/v1/api/message", messageRouter);
app.use("/v1/api/user", userRouter);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    logger.warn({ err }, "JWT verification error");
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  if (err instanceof z.ZodError) {
    logger.warn({ err: z.prettifyError(err) }, "Validation error");
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      ...(env.NODE_ENV !== "production" && {
        details: formatZodError(err),
      }),
    });
  }
  logger.error({ err }, "Unhandled error");
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

server.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, env: env.NODE_ENV },
    "Server started successfully"
  );
});
