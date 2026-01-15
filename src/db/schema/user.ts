import {
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";

import conversationTable from "./conversation";
import messageTable from "./message";

const userTable = pgTable(
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
  (table) => [uniqueIndex("username_idx").on(table.username)]
);

export const userRelations = relations(userTable, ({ many }) => ({
  conversations: many(conversationTable),
  messages: many(messageTable),
}));

export default userTable;
