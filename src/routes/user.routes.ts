import express from "express";

import * as userController from "../controllers/user.controller";
import { verifySession } from "../middleware/verifySession";
import { zodValidator } from "../middleware/validationMiddleware";
import { userSearchQuerySchema } from "../schemas/user.schema";

const router = express.Router();

router.get(
  "/",
  zodValidator(userSearchQuerySchema, "query"),
  verifySession,
  userController.searchUser,
);

export default router;
