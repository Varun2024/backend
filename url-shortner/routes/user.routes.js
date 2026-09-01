import express from "express";
import db from "../db/index.js";
import { users } from "../models/index.js";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import {
  signupPostRequestBodySchema,
  loginPostRequestBodySchema,
} from "../validations/request.validations.js";
import { getUserByEmail } from "../services/user.service.js";
import { hashPaswordWithSalt } from "../utils/hash.js";
import jwt from "jsonwebtoken";
import { createUserToken } from "../utils/token.js";
const router = express.Router();

router.post("/signup", async (req, res) => {
  // zod validation
  const validationResult = signupPostRequestBodySchema.safeParse(req.body);

  if (validationResult.error) {
    return res.status(400).json({ error: validationResult.error.format() });
  }

  const { firstname, lastname, email, password } = validationResult.data;

  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return res.status(400).json({ error: "User already exists" });
  }
  const { password: hashedPassword, salt } = hashPaswordWithSalt(password);

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

router.post("/login", async (req, res) => {
  const validationResult = await loginPostRequestBodySchema.safeParseAsync(
    req.body,
  );

  if (validationResult.error) {
    return res.status(400).json({ error: validationResult.error.format() });
  }

  const { email, password } = validationResult.data;

  const user = await getUserByEmail(email);
  if (!user) {
    return res
      .status(400)
      .json({ error: `User with email ${email} does not exist` });
  }

  const { password: hashedPassword } = hashPaswordWithSalt(password, user.salt);

  if (hashedPassword !== user.password) {
    return res.status(400).json({ error: "Invalid password" });
  }

  const token = createUserToken({ id: user.id });

  return res.json({ token });
});

export default router;
