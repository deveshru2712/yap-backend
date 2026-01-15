import * as z from "zod";

export const userSearchQuerySchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
});

export type userSearchQuery = z.infer<typeof userSearchQuerySchema>;
