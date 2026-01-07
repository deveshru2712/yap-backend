import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const user = pgTable("users", {
  id: serial("id").primaryKey(),
  userName: text("username").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const schema = {
  user,
};

export type InsertUser = typeof user.$inferInsert;
export type SelectUser = typeof user.$inferSelect;
