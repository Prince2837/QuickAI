import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import pool from "./configs/db.js";
import aiRoutes from "./routes/aiRoutes.js";
import "./configs/cloudinary.js"; // just import to initialize
import userRouter from "./routes/userRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

// Public route
app.get("/", (req, res) => {
  res.send("Server is Live!");
});

app.use(requireAuth());

// API routes
app.use("/api/ai", aiRoutes);
app.use("/api/user", userRouter);

// DB test
pool.query("SELECT NOW()")
  .then((res) => {
    console.log("Database connected:", res.rows[0]);
  })
  .catch((err) => {
    console.error("Database connection error", err);
  });

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});