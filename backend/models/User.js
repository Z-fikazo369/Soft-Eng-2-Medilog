// backend/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Plain text muna, iha-hash ng pre-save hook
    lrn: { type: String, required: true },
    studentId: { type: String, required: true },

    // Media
    profilePictureUrl: { type: String, default: "" },
    idPictureUrl: { type: String, default: "" }, // Para sa verification

    // Student Details
    department: { type: String },
    program: { type: String },
    yearLevel: { type: String },

    // System Fields
    role: { type: String, enum: ["student", "admin"], default: "student" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    defaultLoginMethod: {
      type: String,
      enum: ["email", "studentId"],
      default: "email",
    },

    // Auth & Security
    isVerified: { type: Boolean, default: false },
    firstLoginCompleted: { type: Boolean, default: false },
    rememberMe: { type: Boolean, default: false },
    otp: { type: String },
    otpExpiry: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// ✅ CRITICAL FIX: Ito ang pipigil sa Double Hashing
userSchema.pre("save", async function (next) {
  // Kung hindi naman binago ang password (e.g. status lang inupdate), SKIP na.
  if (!this.isModified("password")) {
    return next();
  }

  // Kung bago ang password, i-hash ito.
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method para i-check ang password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
