DROP INDEX "messages_conversation_idx";--> statement-breakpoint
DROP INDEX "messages_created_at_idx";--> statement-breakpoint
DROP INDEX "username_idx";--> statement-breakpoint
CREATE INDEX "conversations_type_idx" ON "conversations" USING btree ("type");--> statement-breakpoint
CREATE INDEX "messages_conversation_created_idx" ON "messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_idx" ON "users" USING btree ("username");