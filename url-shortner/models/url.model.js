import { pgTable, uuid, varchar, timestamp, text } from "drizzle-orm/pg-core";
import { users } from "./user.model.js"; // Import the users table for foreign key reference
export const urls = pgTable("urls", {
  id: uuid("id").primaryKey().defaultRandom(),
  shortCode: varchar("code", { length: 255 }).notNull().unique(),
  targetUrl: text("target_url").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id), // Foreign key reference to users table
        
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});
