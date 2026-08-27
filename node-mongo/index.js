import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import connectDB  from "./connection.js";
import userRoutes from "./routes/user.routes.js";


const app = express()
app.use(express.json());


const PORT = process.env.PORT || 5000;

connectDB(process.env.MONGODB_URI).then(() => {
    console.log('Connected to MongoDB');
})
app.use("/api/users", userRoutes);

app.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`));