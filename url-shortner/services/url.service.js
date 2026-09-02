import { db } from "../db/index.js";
import { urls } from "../models/index.js";

export async function insertUrl({ shortCode, targetUrl, userId }) {
  //   insert the new URL into the database
  const [result] = await db
    .insert(urls)
    .values({
      shortCode,
      targetUrl,
      userId,
    })
    .returning({
      id: urls.id,
      shortCode: urls.shortCode,
      targetUrl: urls.targetUrl,
    });

  return result;
}
