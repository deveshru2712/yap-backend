import z from "zod";

export const signUpBodySchema = z.object({
  username: z.string({ error: "Username should be a string" }),
  email: z.email({ error: "Please provide a valid email" }),
  password: z
    .string()
    .min(6, { error: "Password must contain atleast 6 character" }),
});

export const signInBodySchema = z.object({
  email: z.email({ error: "Please provide a valid email" }),
  password: z
    .string()
    .min(6, { error: "Password must contain atleast 6 character" }),
});

export type signUpBody = z.infer<typeof signUpBodySchema>;
export type signInBody = z.infer<typeof signInBodySchema>;
