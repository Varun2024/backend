import express from "express";
import userRouter from "./routes/user.routes.js";
import adminRouter from "./routes/admin.routes.js";

import { autheticationMiddleware } from "./middleware/auth.middleware.js";
import jwt from "jsonwebtoken"


const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(autheticationMiddleware)

app.get("/", (req, res) => {
  return res.json({ status: "server ok anna" });
});
app.use("/users", userRouter);
app.use("/admin", adminRouter);


app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
