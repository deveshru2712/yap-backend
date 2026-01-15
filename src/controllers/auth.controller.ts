import { NextFunction, Request, RequestHandler, Response } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

import { env } from "../config/env";
import { signInBody, signUpBody } from "../schemas/auth.schema";
import db from "../db/db";
import { userTable } from "../db/schema";
import { authCookie } from "../utils/authCookie";
import { logger } from "../utils/pino";

export const signUp: RequestHandler<
  unknown,
  unknown,
  signUpBody,
  unknown
> = async (req, res, next) => {
  const { username, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await db.query.userTable.findFirst({
      where: eq(userTable.email, email),
    });

    if (existingUser) {
      logger.warn({ email }, "Signup attempt with existing email");
      return res.status(409).json({
        success: false,
        message: "User already exists Please use different credentials",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    // Create user
    const [newUser] = await db
      .insert(userTable)
      .values({
        email,
        username,
        password: hashPassword,
      })
      .returning({
        id: userTable.id,
        email: userTable.email,
        userName: userTable.username,
        tokenVersion: userTable.tokenversion,
      });

    if (!newUser) {
      logger.error({ email }, "Failed to create user in database");
      return res.status(500).json({
        success: false,
        message: "Failed to create user",
      });
    }

    logger.info({ userId: newUser.id }, "User signed up successfully");

    // Set auth cookie
    authCookie(
      {
        id: newUser.id,
        email: newUser.email,
        userName: newUser.userName,
        tokenVersion: newUser.tokenVersion,
      },
      res
    );

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
    });
  } catch (error) {
    logger.error({ err: error, email }, "Signup error");
    next(error);
  }
};

export const signIn: RequestHandler<
  unknown,
  unknown,
  signInBody,
  unknown
> = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await db.query.userTable.findFirst({
      where: eq(userTable.email, email),
    });

    if (!user) {
      logger.warn({ email }, "Login attempt with non-existent email");
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword) {
      logger.warn(
        { email, userId: user.id },
        "Failed login attempt - incorrect password"
      );
      return res.status(401).json({
        success: false,
        message: "Wrong credentials",
      });
    }

    logger.info({ userId: user.id, email }, "User logged in successfully");

    authCookie(
      {
        id: user.id,
        email: user.email,
        userName: user.username,
        tokenVersion: user.tokenversion,
      },
      res
    );

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
    });
  } catch (error) {
    logger.error({ err: error, email }, "Login error");
    next(error);
  }
};

export const logOut: RequestHandler = (req, res, next) => {
  try {
    const userId = req.user?.id;

    res.cookie("yapToken", "", {
      expires: new Date(0),
      httpOnly: true,
      sameSite: "strict",
      secure: env.NODE_ENV === "production",
    });

    logger.info({ userId }, "User logged out");

    res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    logger.error({ err: error }, "Logout error");
    next(error);
  }
};

export const verify = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    logger.error({ err: error }, "Verify endpoint error");
    next(error);
  }
};
