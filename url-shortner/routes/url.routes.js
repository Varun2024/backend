import express from "express";
import { shortenPostRequestBodySchema } from "../validations/request.validations.js";
import { db } from "../db/index.js";
import { urls } from "../models/index.js";
import { nanoid } from "nanoid";
import { ensureAuthenticated } from "../middleware/auth.middleware.js";
import { insertUrl } from "../services/url.service.js";
import { eq, and } from "drizzle-orm";
const router = express.Router();

router.post("/shorten", ensureAuthenticated, async (req, res) => {
  const validationResult = shortenPostRequestBodySchema.safeParse(req.body);

  //   If the request body is invalid, return a 400 error
  if (!validationResult.success) {
    return res.status(400).json({ error: validationResult.error.message });
  }

  const { url, code } = validationResult.data;

  const shortCode = code ?? nanoid(6); // Generate a random short code if not provided

  //   insert the new URL into the database
  const result = await insertUrl({
    shortCode,
    targetUrl: url,
    userId: req.user?.id,
  });

  return res.status(201).json({
    message: "URL shortened successfully",
    id: result.id,
    shortCode: result.shortCode,
    targetUrl: result.targetUrl,
  });
});

// Get all the short codes for the authenticated user
router.get("/codes", ensureAuthenticated, async (req, res) => {
  const codes = await db
    .select()
    .from(urls)
    .where(eq(urls.userId, req.user.id));

  return res.status(200).json({ codes });
});

router.delete("/:id", ensureAuthenticated, async (req, res) => {
  const id = req.params.id;
  const result = await db
    .delete(urls)
  return res.status(200).json({ message: "URL deleted successfully" });
});

// dynamic route to redirect to the target URL based on the short code , which should be at last in the route path, so that it doesn't conflict with other routes
router.get("/:shortcode", async (req, res) => {
  const code = req.params.shortcode;

  //   Find the URL in the database based on the short code
  const [result] = await db.select().from(urls).where(eq(urls.shortCode, code));

  if (!result) {
    return res.status(404).json({ error: "Shortcode not found" });
  }

  return res.redirect(result.targetUrl);
});

export default router;
