import { pgTable, uuid,varchar,timestamp ,text} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),

  firstname: varchar("first_name", { length: 255 }).notNull(),
  lastname: varchar("last_name", { length: 255 }),

  email: varchar("email", { length: 255 }).notNull().unique(),

  password:text().notNull(),
  salt:text().notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(()=>new Date()) 
});
