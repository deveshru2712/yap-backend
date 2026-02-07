import { RequestHandler } from "express";
import { logger } from "../utils/pino";

export const recentConversation: RequestHandler = (req, res, next) => {
  try {
  } catch (error) {
    logger.error({ err: error }, "Unable to fetch recent conversation");
    next(error);
  }
};
