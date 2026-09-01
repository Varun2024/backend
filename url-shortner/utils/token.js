import jwt from "jsonwebtoken";
import { userTokenSchema } from "../validations/token.validation.js";

const JWT_SECRET = process.env.JWT_SECRET;

export function createUserToken(payload) {
  const validationResult = userTokenSchema.safeParse(payload);
  if (validationResult.error) {
    throw new Error(validationResult.error.format());
  }

  const payloadValidatedData = validationResult.data;
  const token = jwt.sign(payloadValidatedData, JWT_SECRET);
  return token;
}

export function validateUserToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload;
  } catch (err) {
    throw new Error("Invalid token");
  }
}
