import { uuid, pgTable, varchar,text , timestamp} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
//   never store plain text passwords in production, this is just for demonstration purposes , passwordHash: text().notNull(),common technique : salt hashing
  password: text().notNull(),
  salt: text().notNull(),
});

export const userSessions = pgTable("user_sessions",{
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull().references(() => usersTable.id),
  createdAt: timestamp().notNull().defaultNow(),
});
