import * as z from "zod";

export const signUpBodySchema = z.object({
  userName: z.string("Username should be a string"),
  email: z.email("Please provide a valid email"),
  password: z.string().min(6, "Password must contain atleast 6 character"),
});

export const signInBodySchema = z.object({
  email: z.email("Please provide a valid email"),
  password: z.string().min(6, "Password must contain atleast 6 character"),
});

export type signUpBody = z.infer<typeof signUpBodySchema>;
export type signInBody = z.infer<typeof signInBodySchema>;
