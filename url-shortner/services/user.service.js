import { eq } from "drizzle-orm";
import db from "../db/index.js";
import { users } from "../models/index.js";

export async function getUserByEmail(email) {
  const [existingUser] = await db
    .select({
      id: users.id,
      firstname: users.firstname,
      lastname: users.lastname,
      email: users.email,
      salt: users.salt,
      password: users.password,
    })
    .from(users)
    .where(eq(users.email, email));

  return existingUser;
}
