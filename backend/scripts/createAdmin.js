import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/User.js";

async function createAdminAccount() {
  try {
    // Connect to database
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/medilog"
    );
    console.log("✅ Connected to database");

    const adminData = {
      username: "admin_delta",
      email: "delta@gmail.com",
      password: "123456ABC!",
      lrn: "ADMIN-DELTA-001",
      studentId: "ADMIN-DELTA-001",
      role: "admin",
      status: "approved",
      isVerified: true,
      firstLoginCompleted: true,
      department: "Administration",
      program: "Admin Portal",
      yearLevel: "N/A",
    };

    // Check if user already exists
    const existingUser = await User.findOne({ email: adminData.email });
    if (existingUser) {
      console.log("⚠️  Admin account already exists!");
      console.log("📧 Email: delta@gmail.com");
      console.log("🔐 Password: 123456ABC!");
      await mongoose.connection.close();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    // Create new user
    const newAdmin = new User({
      ...adminData,
      password: hashedPassword,
    });

    await newAdmin.save();
    console.log("✅ Admin account created successfully!");
    console.log("📧 Email: delta@gmail.com");
    console.log("🔐 Password: 123456ABC!");
    console.log("👤 Username: admin_delta");

    await mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error creating admin account:", error);
    process.exit(1);
  }
}

createAdminAccount();
