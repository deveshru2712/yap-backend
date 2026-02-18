import z from "zod";

export const searchQuerySchema = z.object({
  query: z.string().trim().min(1, "Username is required"),
});

export type searchQuery = z.infer<typeof searchQuerySchema>;
