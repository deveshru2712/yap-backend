import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import jwt from "jsonwebtoken";
import { logger } from "../utils/pino";
import db from "../db/db";
import { eq } from "drizzle-orm";
import { userTable } from "../db/schema";

export const verifySession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.yapToken;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      email: string;
      userName: string;
      tokenVersion: number;
    };

    const user = await db.query.userTable.findFirst({
      where: eq(userTable.id, payload.id),
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
      userName: payload.userName,
      tokenVerstion: payload.tokenVersion,
    };
    next();
  } catch (error) {
    logger.debug({ err: error }, "JWT verification failed");
    req.user = null;
    next();
  }
};
