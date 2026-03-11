import z from "zod";

export const searchQuerySchema = z.object({
  query: z.string().trim().min(1, "Username is required"),
});

export const isUserNameAvailableQuerySchema = z.object({
  username: z.string({ error: "Username should be a string" }),
});

export type searchQuery = z.infer<typeof searchQuerySchema>;
export type isUserNameAvailableQuery = z.infer<
  typeof isUserNameAvailableQuerySchema
>;
