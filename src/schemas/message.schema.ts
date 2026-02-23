import z from "zod";

export const fetchMessageQuerySchema = z.object({
  conversationId: z.string("conversationId is required").trim(),
});

export type fetchMessageQuery = z.infer<typeof fetchMessageQuerySchema>;

export const sendDirectMessageBodySchema = z.object({
  conversationId: z.string().trim().optional(),
  content: z.string().trim().min(1, "Content is required"),
  receiverId: z.string("ReceiverId is required").trim(),
});

export type sendDirectMessageBody = z.infer<typeof sendDirectMessageBodySchema>;
