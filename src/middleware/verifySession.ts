import { eq } from "drizzle-orm";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import db from "../db/db";
import { schema } from "../db/schema";
import { logger } from "../utils/pino";

export const verifySession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.yap_token;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;

    const user = await db.query.user.findFirst({
      where: eq(schema.user.id, payload.id),
      columns: { tokenversion: true },
    });

    if (!user) {
      req.user = null;
    }

    if (user?.tokenversion !== payload.tokenVersion) {
      req.user = null;
    }

    req.user = {
      id: payload.id,
      email: payload.email,
      username: payload.username,
      tokenVerstion: payload.tokenVersion,
    };
    next();
  } catch (error) {
    logger.debug({ err: error }, "JWT verification failed");
    req.user = null;
    next();
  }
};
