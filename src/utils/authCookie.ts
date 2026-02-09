import { Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env";

export const authCookie = (user: AuthTokenPayload, res: Response): void => {
  if (!user) return;

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      tokenVersion: user.tokenVersion,
    },
    env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  res.cookie("yap_token", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};
