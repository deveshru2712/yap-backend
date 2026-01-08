import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { logger } from "../utils/pino";

export const zodValidator =
  <T>(schema: z.ZodType<T>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await schema.safeParseAsync(req.body);

    if (!result.success) {
      logger.warn(
        {
          id: req.id,
          method: req.method,
          url: req.originalUrl,
          issues: result.error.issues,
        },
        "Request validation failed"
      );

      return next(result.error);
    }

    req.body = result.data;
    next();
  };
