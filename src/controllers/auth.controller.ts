import { NextFunction, Request, RequestHandler, Response } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

import { env } from "../config/env";
import { signInBody, signUpBody } from "../schemas/auth.schema";
import db from "../db/db";
import { userTable } from "../db/schema";
import { authCookie } from "../utils/authCookie";

export const signUp: RequestHandler<
  unknown,
  unknown,
  signUpBody,
  unknown
> = async (req, res, next) => {
  const { userName, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await db.query.userTable.findFirst({
      where: eq(userTable.email, email),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
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
        userName,
        password: hashPassword,
      })
      .returning({
        id: userTable.id,
        email: userTable.email,
        userName: userTable.userName,
      });

    // checking if the user was created
    if (!newUser) {
      return res.status(500).json({
        success: false,
        message: "Failed to create user",
      });
    }

    // Set auth cookie
    authCookie(
      {
        id: newUser.id,
        email: newUser.email,
        userName: newUser.userName,
      },
      res
    );

    // Success response
    return res.status(201).json({
      success: true,
      message: "Account created successfully",
    });
  } catch (error) {
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
    // checking if the user exists or not
    const user = await db.query.userTable.findFirst({
      where: eq(userTable.email, email),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // matching password
    const checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword) {
      return res.status(401).json({
        success: false,
        message: "Wrong credentials",
      });
    }

    // setting cookie
    authCookie(
      {
        id: user.id,
        email: user.email,
        userName: user.userName,
      },
      res
    );

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const logOut: RequestHandler = (req, res, next) => {
  try {
    res.cookie("yapToken", "", {
      expires: new Date(0),
      httpOnly: true,
      sameSite: "strict",
      secure: env.NODE_ENV === "production",
    });
    res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
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
  } catch (error) {
    next(error);
  }
};
