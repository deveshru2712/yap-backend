import { eq } from "drizzle-orm";
import { RequestHandler } from "express";

import db from "../db/db";
import { user } from "../db/schema";
import { isUserNameAvailableQuery } from "../schemas/user.schema";
import { logger } from "../utils/pino";

export const checkAvailableUsername: RequestHandler<
  unknown,
  unknown,
  unknown,
  isUserNameAvailableQuery
> = async (req, res, next) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ available: false });
    }

    const users = await db
      .select()
      .from(user)
      .where(eq(user.username, username));

    res.json({ available: users.length === 0 });
  } catch (error) {
    logger.error(
      { userId: req.user?.id, err: error },
      "Failed to create group"
    );

    next(error);
  }
};
