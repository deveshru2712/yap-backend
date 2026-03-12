import z from "zod";

export const createGroupConversationBodySchema = z.object({
  name: z
    .string({ error: "group name should be a string" })
    .min(3, { error: "group name must contain atleast 3 character" }),
  userId: z
    .string()
    .array()
    .min(1, { error: "there must be atleast one member" }),
});

export type createGroupConversationBody = z.infer<
  typeof createGroupConversationBodySchema
>;
