import mongoose from "mongoose";
import { createDefaultAdmin } from "../controllers/authController.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/medilog"
    );
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    await createDefaultAdmin();
  } catch (error) {
    console.error(`❌ Database connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
