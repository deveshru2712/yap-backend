import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { v7 as uuidv7 } from "uuid";
import userTable from "./user";

export const conversationTable = pgTable("conversations", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  type: text("type", { enum: ["direct", "group"] })
    .notNull()
    .default("direct"),
  name: text("name"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const conversationParticipantsTable = pgTable(
  "conversation_participants",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversationTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    unreadCount: integer("unread_count").default(0).notNull(),
    lastReadAt: timestamp("last_read_at", { withTimezone: true }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("conversation_participants_user_idx").on(table.userId),
    index("conversation_participants_conversation_idx").on(
      table.conversationId,
    ),
    uniqueIndex("conversation_participants_unique").on(
      table.conversationId,
      table.userId,
    ),
  ],
);
