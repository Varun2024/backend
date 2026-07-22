import express from "express";
import db from "../db/index.js";
import { usersTable } from "../db/schema.js";
import {
  ensuredAuthenticated,
  restrictToRole,
} from "../middleware/auth.middleware.js";

const router = express.Router();
const adminRestrict = restrictToRole("ADMIN");

router.use(ensuredAuthenticated)
router.use(adminRestrict)


router.get("/users", ensuredAuthenticated, adminRestrict , async (req, res) => {
  const users = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
    })
    .from(usersTable);

  return res.json({ users });
});

export default router;
