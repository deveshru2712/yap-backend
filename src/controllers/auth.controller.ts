import { RequestHandler } from "express";
import { signUpBody } from "../schemas/auth.schema";

export const signUp: RequestHandler<unknown, unknown, signUpBody, unknown> = (
  req,
  res
) => {
  const { userName, email, password } = req.body;
};

export const signIn: RequestHandler = () => {};

export const logOut: RequestHandler = () => {};
