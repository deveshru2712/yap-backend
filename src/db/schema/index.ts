import {
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { v7 as uuidv7 } from "uuid";

const user = pgTable(
  "users",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    username: text("username").notNull(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    profilepic: text("profile_pic"),
    tokenversion: integer("token_version").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("username_idx").on(table.username)],
);

const conversation = pgTable("conversations", {
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

const conversationParticipants = pgTable(
  "conversation_participants",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // unreadCount: integer("unread_count").default(0).notNull(),
    // lastReadAt: timestamp("last_read_at", { withTimezone: true }),
    // joinedAt: timestamp("joined_at", { withTimezone: true })
    //   .$defaultFn(() => new Date())
    //   .notNull(),
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

const message = pgTable(
  "messages",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
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

export const schema = {
  user,
  conversation,
  conversationParticipants,
  message,
};
