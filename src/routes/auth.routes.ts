import express from "express";

import { zodValidator } from "../middleware/validationMiddleware";
import { signInBodySchema, signUpBodySchema } from "../schemas/auth.schema";
import * as authController from "../controllers/auth.controller";
import { verifySession } from "../middleware/verifySession";

const router = express.Router();

router.post("/signup", zodValidator(signUpBodySchema), authController.signUp);
router.post("/signin", zodValidator(signInBodySchema), authController.signIn);
router.post("/logout", authController.logOut);

router.get("/verify", verifySession, authController.verify);

export default router;
