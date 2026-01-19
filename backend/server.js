import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import medicalRecordRoutes from "./routes/medicalRecordRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import adminActivityRoutes from "./routes/adminActivityRoutes.js";

const app = express();

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
    // 👇 ITO ANG MAHALAGA: Para mabasa ng frontend ang headers na ito
    exposedHeaders: ["RateLimit-Limit", "RateLimit-Remaining", "Retry-After"],
  })
);
app.use(express.json());

// Connect to database
connectDB();

// Routes
app.use("/api", authRoutes);
app.use("/api", medicalRecordRoutes);

// ✅ NEW ROUTE: Lahat ng admin backup operations ay dadaan dito
app.use("/api/users", adminRoutes);

app.use("/api/users", userRoutes);

app.use("/api", notificationRoutes);

app.use("/api/analytics", analyticsRoutes);

// ✅ NEW ROUTE: Admin activity logs
app.use("/api", adminActivityRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
