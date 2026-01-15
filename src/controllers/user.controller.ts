import { RequestHandler } from "express";
import { and, ilike, ne } from "drizzle-orm";

import { userTable } from "../db/schema";
import { userSearchQuery } from "../schemas/user.schema";
import { logger } from "../utils/pino";
import db from "../db/db";

export const searchUser: RequestHandler<
  unknown,
  unknown,
  unknown,
  userSearchQuery
> = async (req, res, next) => {
  const { username } = req.query;
  const currentUser = req.user;

  if (!currentUser) return null;

  try {
    // fetching the userlist
    const userList = await db.query.userTable.findMany({
      where: and(
        ilike(userTable.username, `${username}%`),
        ne(userTable.id, currentUser.id)
      ),
      columns: {
        id: true,
        username: true,
        profilepic: true,
      },
      limit: 10,
    });

    // logging succcess
    logger.info(
      {
        search: username,
        resultCount: userList.length,
      },
      "User search completed successfully"
    );

    // returning the userlist
    return res.status(200).json({
      success: true,
      message: "Successfully fetched user list",
      data: userList,
    });
  } catch (error) {
    logger.error({ err: error }, "Unable to search username");
    next(error);
  }
};
