import { Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

interface UserPayload {
  id: string;
  userName: string;
  email: string;
  tokenVersion: number;
}

export const authCookie = (user: UserPayload, res: Response): void => {
  if (!user) return;

  const token = jwt.sign(
    {
      id: user.id,
      userName: user.userName,
      email: user.email,
      tokenVersion: user.tokenVersion,
    },
    env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  res.cookie("yapToken", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};
