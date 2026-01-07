import { RequestHandler } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

import { signUpBody } from "../schemas/auth.schema";
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

export const signIn: RequestHandler = () => {};

export const logOut: RequestHandler = () => {};
