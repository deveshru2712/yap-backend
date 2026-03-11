import express from "express";

import * as userController from "../controllers/user.controller";
import { zodValidator } from "../middleware/validationMiddleware";
import { isUserNameAvailableQuerySchema } from "../schemas/user.schema";

const router = express.Router();

router.get(
  "/check-username",
  zodValidator(isUserNameAvailableQuerySchema, "query"),
  userController.checkAvailableUsername
);

export default router;
