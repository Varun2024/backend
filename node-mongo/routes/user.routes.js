import express from "express";
import User from "../models/user.model.js";
import { randomBytes, createHmac } from "crypto";
import jsonwebtoken from "jsonwebtoken";
const router = express.Router();

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const salt = randomBytes(256).toString("hex");
  const hashedPassword = createHmac("sha256", salt)
    .update(password)
    .digest("hex");

    const user = await User.insertOne({
        name,
        email,
        password: hashedPassword,
        salt
    })

    return res.status(201).json({ message: "success", data:{id: user._id} });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const hashedPassword = createHmac("sha256", user.salt)
    .update(password)
    .digest("hex");

  if (hashedPassword !== user.password) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const payload = {
    name: user.name,
    email: user.email,
    _id: user._id,
  }

  const token = jsonwebtoken.sign(payload, process.env.JWT_SECRET);

  return res.status(200).json({ message: "Login successful", data: { token } });
});

export default router;
