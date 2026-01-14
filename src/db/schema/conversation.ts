import { pgTable, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";

import userTable from "./user";
import messageTable from "./message";

const conversationTable = pgTable(
  "conversations",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: uuid("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [index("conversations_user_id_idx").on(table.userId)]
);

export const conversationRelations = relations(
  conversationTable,
  ({ one, many }) => ({
    user: one(userTable, {
      fields: [conversationTable.userId],
      references: [userTable.id],
    }),
    messages: many(messageTable),
  })
);

export default conversationTable;
