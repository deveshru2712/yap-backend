import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import jwt from "jsonwebtoken";
import { logger } from "../utils/pino";

export const verifySession = (
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
    };

    req.user = {
      id: payload.id,
      email: payload.email,
      userName: payload.userName,
    };
    next();
  } catch (error) {
    logger.debug({ err: error }, "JWT verification failed");
    req.user = null;
    next();
  }
};
