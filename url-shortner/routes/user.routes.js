import express from "express";
import db from "../db/index.js";
import { users } from "../models/index.js";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { signupPostRequestBodySchema } from "../validations/request.validations.js";
const router = express.Router();

router.post("/signup", async (req, res) => {

  // zod validation
  const validationResult = signupPostRequestBodySchema.safeParse(req.body);

  if (validationResult.error) {
    return res
      .status(400)
      .json({ error: validationResult.error.format() });
  }

  const { firstname, lastname, email, password } = validationResult.data;

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (existingUser) {
    return res.status(400).json({ error: "User already exists" });
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const hashedPassword = crypto
    .createHmac("sha256", salt)
    .update(password)
    .digest("hex");

  const [user] = await db
    .insert(users)    
    .values({
      firstname,
      lastname,
      email,
      salt,
      password: hashedPassword,
    })
    .returning({ id: users.id });

  return res
    .status(201)
    .json({ message: "User created successfully", userId: user.id });
});

export default router;
