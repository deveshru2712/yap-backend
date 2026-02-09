import { and, ilike, ne } from "drizzle-orm";
import { RequestHandler } from "express";

import db from "../db/drizzle";
import { schema } from "../db/schema/schema";
import { userSearchQuery } from "../schemas/user.schema";
import { logger } from "../utils/pino";

export const searchUser: RequestHandler<
  unknown,
  unknown,
  unknown,
  userSearchQuery
> = async (req, res, next) => {
  const { username } = req.query;
  const currentUser = req.user;

  if (!currentUser) {
    logger.warn(
      { unauthorized: "user not loggged in" },
      "cannot search for user"
    );
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  try {
    // fetching the userlist
    const userList = await db.query.user.findMany({
      where: and(
        ilike(schema.user.username, `${username}%`),
        ne(schema.user.id, currentUser.id)
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
