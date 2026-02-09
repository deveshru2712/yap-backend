import { NextFunction, Request, Response } from "express";
import { z } from "zod";

import { logger } from "../utils/pino";

type ValidationSource = "body" | "query" | "params";

export const zodValidator =
  <T>(schema: z.ZodType<T>, source: ValidationSource = "body") =>
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await schema.safeParseAsync(req[source]);

    if (!result.success) {
      logger.warn(
        {
          id: req.id,
          method: req.method,
          url: req.originalUrl,
          source,
          issues: result.error.issues,
        },
        "Request validation failed"
      );

      return next(result.error);
    }

    if (source === "body" || source === "params") {
      req[source] = result.data;
    }
    next();
  };
