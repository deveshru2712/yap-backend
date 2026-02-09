import express from "express";

import * as authController from "../controllers/auth.controller";
import { zodValidator } from "../middleware/validationMiddleware";
import { verifySession } from "../middleware/verifySession";
import { signInBodySchema, signUpBodySchema } from "../schemas/auth.schema";

const router = express.Router();

router.post("/sign-up", zodValidator(signUpBodySchema), authController.signUp);
router.post("/sign-in", zodValidator(signInBodySchema), authController.signIn);
router.post("/logout", authController.logOut);

router.get("/verify", verifySession, authController.verify);

export default router;
