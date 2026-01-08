import * as z from "zod";

export const formatZodError = (error: z.ZodError) => {
  const formatted: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = issue.path.join(".");
    formatted[field] = issue.message;
  }

  return formatted;
};
