import crypto from "crypto";

export function hashPaswordWithSalt(password,userSalt=undefined) {
  const salt = userSalt ?? crypto.randomBytes(16).toString("hex");
  const hashedPassword = crypto
    .createHmac("sha256", salt)
    .update(password)
    .digest("hex");``

  return { password: hashedPassword, salt };
}
