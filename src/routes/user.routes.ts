import express from "express";

import * as userController from "../controllers/user.controller";
import { zodValidator } from "../middleware/validationMiddleware";
import { verifySession } from "../middleware/verifySession";
import { searchQuerySchema } from "../schemas/user.schema";

const router = express.Router();

export default router;
