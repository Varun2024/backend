import express from "express";
import userRouter from "./routes/user.routes.js";
import urlRouter from "./routes/url.routes.js";
import {authenticationMiddleware} from "./middleware/auth.middleware.js";
const app = express();

const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(authenticationMiddleware); // apply the authentication middleware to all routes
app.use("/user", userRouter);
app.use(urlRouter);
app.get("/", (req,res) => {
  return res.json({ status: "Server is running" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
