import express from "express";
import db from "../db/index.js";
import { usersTable, userSessions } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { randomBytes, createHmac } from "node:crypto";
import jwt from 'jsonwebtoken'
import {ensuredAuthenticated} from '../middleware/auth.middleware.js'

const router = express.Router();

router.patch("/", ensuredAuthenticated ,async (req, res) => {

  const { name } = req.body;
  await db.update(usersTable).set({name}).where(eq(usersTable.id,user.id))
  return res.status(200).json({ status: "success"});
});

// returns current logged in user
router.get("/",ensuredAuthenticated, async (req, res) => {


  return res.json({ status: "success", data: user });
});

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  const [existingUser] = await db
    .select()
    .from(usersTable)
    .where((table) => eq(table.email, email));

  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }
  // generate a random salt for the user
  const salt = randomBytes(256).toString("hex");
  // create a hashed password using the password and the salt
  const hashedPassword = createHmac("sha256", salt)
    .update(password)
    .digest("hex");

  const [user] = await db
    .insert(usersTable)
    .values({
      name,
      email,
      password: hashedPassword,
      salt,
    })
    .returning({ id: usersTable.id });

  return res.status(201).json({ status: "success", data: { userId: user.id } });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const [existingUser] = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      salt: usersTable.salt,
      password: usersTable.password,
      role:usersTable.role,
    })
    .from(usersTable)
    .where((table) => eq(table.email, email));

  if (!existingUser) {
    return res
      .status(404)
      .json({ error: `User with email ${email} not found` });
  }

  const salt = existingUser.salt;
  const existingHash = existingUser.password;

  const newHash = createHmac("sha256", salt).update(password).digest("hex");

  if (newHash !== existingHash) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  // generate a session for the user and return it to the client
  // const [session] = await db
  //   .insert(userSessions)
  //   .values({
  //     userId: existingUser.id,
  //   })
  //   .returning({ id: userSessions.id });

  const payload = {
    id: existingUser.id,
    email: existingUser.email,
    name: existingUser.name,
    role:existingUser.role
  }

  const token = jwt.sign(payload, process.env.JWT_secret)

  return res.status(200).json({
    status: "success", 
    data: { message: "Logged in successfully", token },
  });
});

export default router;
