import z from "zod";

// export const sendMessageQuerySchema = z.object({
// conversationId: z.string().trim().min(1, "Conversa is required"),
// });

// export type sendMessageQuery = z.infer<typeof sendMessageQuerySchema>;

export const fetchMessageQuerySchema = z.object({
  conversationId: z.string("conversationId is required").trim(),
});

export type fetchMessageQuery = z.infer<typeof fetchMessageQuerySchema>;

export const sendMessageBodySchema = z.object({
  content: z.string().trim().min(1, "Content is required"),
});

export type sendMessageBody = z.infer<typeof sendMessageBodySchema>;
