import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import jwt, { JwtPayload } from "jsonwebtoken";

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
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = {
      id: payload.sub,
      email: payload.email,
      userName: payload.userName,
    };
  } catch {
    req.user = null;
  }

  next();
};
