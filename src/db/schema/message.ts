import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { v7 as uuidv7 } from "uuid";

import userTable from "./user";
import { conversationTable } from "./conversation";

const messageTable = pgTable(
  "messages",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversationTable.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["text", "image"] })
      .notNull()
      .default("text"),
    content: text("content"), // message text OR image URL
    createdAt: timestamp("created_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("messages_conversation_idx").on(table.conversationId),
    index("messages_created_at_idx").on(table.createdAt),
  ],
);

export default messageTable;
