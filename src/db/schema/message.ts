import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";

import conversationTable from "./conversation";
import userTable from "./user";

const messageTable = pgTable(
  "messages",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    content: text("content").notNull(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversationTable.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("messages_conversation_id_idx").on(table.conversationId),
    index("messages_sender_id_idx").on(table.senderId),
  ]
);

export const messageRelations = relations(messageTable, ({ one }) => ({
  conversation: one(conversationTable, {
    fields: [messageTable.conversationId],
    references: [conversationTable.id],
  }),
  sender: one(userTable, {
    fields: [messageTable.senderId],
    references: [userTable.id],
  }),
}));

export default messageTable;
