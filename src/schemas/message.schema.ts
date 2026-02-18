import z from "zod";

export const sendMessageQuerySchema = z.object({
  receiverId: z.string().trim().min(1, "UserId is required"),
});

export type sendMessageQuery = z.infer<typeof sendMessageQuerySchema>;

export const sendMessageBodySchema = z.object({
  content: z.string().trim().min(1, "Content is required"),
});

export type sendMessageBody = z.infer<typeof sendMessageBodySchema>;
