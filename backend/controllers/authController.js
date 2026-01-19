import bcrypt from "bcrypt";
import User from "../models/User.js";
import generateOTP from "../utils/generateOTP.js";
import { sendOTPEmail, sendApprovalEmail } from "../utils/emailService.js";
import axios from "axios";
import generateToken from "../utils/generateToken.js";
import AdminActivityLog from "../models/AdminActivityLog.js";

// Helper function to verify CAPTCHA
async function verifyCaptcha(token) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    console.error("RECAPTCHA_SECRET_KEY is not set in .env");
    return { success: false, message: "CAPTCHA not configured" };
  }

  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`
    );
    return response.data;
  } catch (error) {
    console.error("❌ CAPTCHA verification error:", error.message);
    return { success: false, message: "Error verifying CAPTCHA" };
  }
}

// 🧩 Signup - Create pending account
export async function signup(req, res) {
  try {
    const {
      username,
      email,
      lrn,
      studentId,
      role,
      preferredLoginMethod,
      department,
      program,
      yearLevel,
      password, // ✅ Only for admin signup
    } = req.body;

    const idPictureUrl = req.file ? req.file.path : null;

    // Check duplicates
    const existingUser = await User.findOne({
      $or: [{ email }, { lrn }, { studentId }],
    });
    if (existingUser) {
      return res.status(400).json({
        message: "User with this email, LRN, or Student ID already exists",
      });
    }

    if (role === "student") {
      if (!idPictureUrl) {
        return res
          .status(400)
          .json({ message: "Student ID Picture is required." });
      }

      // ✅ Create User WITHOUT password
      // Password will be set to LRN when admin approves
      const user = new User({
        username,
        email,
        lrn,
        studentId,
        // ❌ NO password field here - will be set on approval
        role,
        status: "pending",
        defaultLoginMethod: preferredLoginMethod || "email",
        idPictureUrl: idPictureUrl,
        isVerified: false,
        firstLoginCompleted: false,
        department,
        program,
        yearLevel,
      });

      await user.save();

      return res.status(201).json({
        message:
          "Account created successfully. Please wait for admin approval. You will receive an email notification once approved.",
        userId: user._id,
        status: "pending",
      });
    }

    // For admins: Create account directly with password
    if (!password) {
      return res
        .status(400)
        .json({ message: "Password is required for admin accounts" });
    }

    const admin = new User({
      username,
      email,
      lrn: lrn || "N/A",
      studentId: studentId || "N/A",
      password, // Plain text - User.js will hash it
      role: "admin",
      status: "approved",
      isVerified: true,
      firstLoginCompleted: true,
    });

    await admin.save();

    res.status(201).json({
      message: "Admin account created successfully",
      userId: admin._id,
    });
  } catch (error) {
    console.error("❌ Signup error:", error);
    res.status(400).json({ message: error.message });
  }
}

// 🔐 Login - Send OTP AFTER successful login
export async function login(req, res) {
  try {
    const { email, password, role, captchaToken } = req.body;

    if (process.env.NODE_ENV !== "development") {
      const captchaResult = await verifyCaptcha(captchaToken);
      if (!captchaResult.success) {
        return res.status(400).json({
          message: "CAPTCHA verification failed. Please try again.",
        });
      }
    }

    const user = await User.findOne({
      $or: [{ email }, { studentId: email }],
    });

    console.log("🔍 Login attempt for:", email);
    console.log("👤 User found:", user ? "YES" : "NO");
    if (user) {
      console.log("📊 User status:", user.status);
      console.log("🔑 Has password:", user.password ? "YES" : "NO");
      console.log("👥 Role:", user.role);
    }

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid credentials - User not found" });
    }

    if (user.role === "student" && user.status === "pending") {
      return res.status(403).json({
        message:
          "Your account is pending admin approval. Please wait for confirmation.",
        status: "pending",
      });
    }

    if (user.status === "rejected") {
      return res.status(403).json({
        message:
          "Your account application was rejected. Please contact administration.",
        status: "rejected",
      });
    }

    // ✅ Check if user has a password (approved users should have one)
    if (!user.password) {
      return res.status(400).json({
        message:
          "Account not yet approved or password not set. Please wait for admin approval.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("🔐 Password valid:", isPasswordValid);

    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ message: "Invalid credentials - Incorrect password" });
    }

    if (role && user.role !== role) {
      return res.status(403).json({ message: "Role mismatch" });
    }

    // Student Login (Remember Me)
    if (user.role === "student" && user.rememberMe) {
      return res.json({
        message: "Login successful",
        user,
        requiresOTP: false,
        token: generateToken(user._id),
      });
    }

    // Student Login (Requires OTP)
    if (user.role === "student") {
      const otp = generateOTP();
      user.otp = otp;
      user.otpExpiry = Date.now() + 5 * 60 * 1000;
      await user.save();

      try {
        await sendOTPEmail(user.email, "MEDILOG - Login Verification OTP", otp);
      } catch (emailError) {
        console.error(`❌ Failed to send email:`, emailError.message);
        console.log(`\n📧 BACKUP - OTP for ${user.email}: ${otp}\n`);
      }

      return res.json({
        message: "OTP sent to your email for verification.",
        email: user.email,
        requiresOTP: true,
      });
    }

    // Admin Login
    if (user.role === "admin") {
      const ipAddress =
        req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.socket.remoteAddress ||
        "unknown";
      const userAgent = req.headers["user-agent"] || "";

      try {
        await AdminActivityLog.create({
          adminId: user._id,
          adminEmail: user.email,
          adminUsername: user.username,
          action: "LOGIN",
          ipAddress,
          userAgent,
          status: "success",
        });
      } catch (logError) {
        console.error("❌ Failed to log admin login:", logError);
      }
    }

    res.json({
      message: "Login successful",
      user,
      requiresOTP: false,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: error.message });
  }
}

// 🔍 Verify OTP
export async function verifyOTP(req, res) {
  try {
    const { email, otp, rememberMe } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "User not found" });
    if (user.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });
    if (user.otpExpiry < Date.now())
      return res.status(400).json({ message: "OTP expired" });

    user.isVerified = true;
    user.firstLoginCompleted = true;
    user.rememberMe = rememberMe || false;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({
      message: "OTP verified successfully",
      user,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("❌ OTP verification error:", error);
    res.status(500).json({ message: error.message });
  }
}

// 📋 Get Pending Accounts
export async function getPendingAccounts(req, res) {
  try {
    const pendingUsers = await User.find({
      role: "student",
      status: "pending",
    })
      .select("-password -otp -otpExpiry")
      .sort({ createdAt: -1 });

    res.json({
      message: "Pending accounts retrieved successfully",
      accounts: pendingUsers,
      count: pendingUsers.length,
    });
  } catch (error) {
    console.error("❌ Error fetching pending accounts:", error);
    res.status(500).json({ message: error.message });
  }
}

// 📖 Get ALL Student Accounts
export async function getAllStudentAccounts(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { role: "student" };

    const accounts = await User.find(query)
      .select("-password -otp -otpExpiry")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await User.countDocuments(query);

    res.json({
      message: "Student accounts retrieved successfully",
      accounts: accounts,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount: totalCount,
    });
  } catch (error) {
    console.error("❌ Error fetching all student accounts:", error);
    res.status(500).json({ message: error.message });
  }
}

// ✅ Approve Account
export async function approveAccount(req, res) {
  try {
    const { userId } = req.params;
    const { adminId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.status !== "pending") {
      return res.status(400).json({ message: "Account is not pending" });
    }

    // ✅ Set password to LRN (plain text - User.js will hash it)
    user.password = user.lrn;

    user.status = "approved";
    user.approvedBy = adminId;
    user.approvedAt = new Date();

    await user.save(); // User.js pre-save hook will hash the password

    try {
      await sendApprovalEmail(
        user.email,
        user.username,
        user.defaultLoginMethod,
        user.lrn
      );
    } catch (emailError) {
      console.error(`❌ Failed to send approval email:`, emailError.message);
    }

    res.json({
      message: `Account approved successfully. Email notification sent to ${user.username}.`,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        studentId: user.studentId,
        defaultLoginMethod: user.defaultLoginMethod,
        status: user.status,
      },
    });

    // Log Activity
    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      "unknown";
    const userAgent = req.headers["user-agent"] || "";

    try {
      await AdminActivityLog.create({
        adminId: req.user?._id || adminId,
        adminEmail: req.user?.email || "admin",
        adminUsername: req.user?.username || "admin",
        action: "APPROVE_ACCOUNT",
        actionDetails: {
          userId: user._id.toString(),
          userName: user.username,
          details: `Approved account for ${user.email}`,
        },
        ipAddress,
        userAgent,
        status: "success",
      });
    } catch (logError) {
      console.error("❌ Failed to log activity:", logError);
    }
  } catch (error) {
    console.error("❌ Approve account error:", error);
    res.status(500).json({ message: error.message });
  }
}

// ❌ Reject Account
export async function rejectAccount(req, res) {
  try {
    const { userId } = req.params;
    const { adminId, reason } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.status !== "pending") {
      return res.status(400).json({ message: "Account is not pending" });
    }
    user.status = "rejected";
    user.approvedBy = adminId;
    user.approvedAt = new Date();
    await user.save();
    res.json({
      message: "Account rejected successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        status: user.status,
      },
    });

    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      "unknown";
    const userAgent = req.headers["user-agent"] || "";

    try {
      await AdminActivityLog.create({
        adminId: req.user?._id || adminId,
        adminEmail: req.user?.email || "admin",
        adminUsername: req.user?.username || "admin",
        action: "REJECT_ACCOUNT",
        actionDetails: {
          userId: user._id.toString(),
          userName: user.username,
          reason,
          details: `Rejected account for ${user.email}`,
        },
        ipAddress,
        userAgent,
        status: "success",
      });
    } catch (logError) {
      console.error("❌ Failed to log activity:", logError);
    }
  } catch (error) {
    console.error("❌ Reject account error:", error);
    res.status(500).json({ message: error.message });
  }
}

// 🔄 Resend OTP
export async function resendOTP(req, res) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;
    await user.save();
    try {
      await sendOTPEmail(email, "MEDILOG - New OTP", otp);
      res.json({ message: "New OTP sent to your email" });
    } catch (emailError) {
      console.error(`❌ Failed to send email:`, emailError.message);
      console.log(`\n📧 BACKUP - OTP for ${email}: ${otp}\n`);
      res.json({ message: "Please check console for OTP (email failed)" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// 🔒 Forgot Password
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();
    try {
      await sendOTPEmail(email, "MEDILOG - Password Reset OTP", otp);
      res.json({
        message: "Password reset OTP sent to your email",
        email: email,
      });
    } catch (emailError) {
      console.error(`❌ Failed to send email:`, emailError.message);
      console.log(`\n📧 BACKUP - Password Reset OTP for ${email}: ${otp}\n`);
      res.json({
        message: "OTP generated. Check console for code.",
        email: email,
      });
    }
  } catch (error) {
    console.error("❌ Forgot password error:", error);
    res.status(500).json({ message: error.message });
  }
}

// 🔄 Reset Password
export async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // ✅ Set plain text password. User.js handles hashing.
    user.password = newPassword;

    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({
      message:
        "Password reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    console.error("❌ Reset password error:", error);
    res.status(500).json({ message: error.message });
  }
}

// 🛡️ Default admin creation
export async function createDefaultAdmin() {
  try {
    const adminExists = await User.findOne({ role: "admin" });
    if (!adminExists) {
      const admin = new User({
        username: "Admin",
        email: "admin@medilog.com",
        password: "MediLog@2025", // Plain text - User.js will hash it
        lrn: "N/A",
        studentId: "N/A",
        role: "admin",
        status: "approved",
        isVerified: true,
        firstLoginCompleted: true,
      });
      await admin.save();
      console.log("✅ Default admin created: admin@medilog.com / MediLog@2025");
    } else {
      console.log("ℹ️ Admin account already exists");
    }
  } catch (err) {
    console.error("❌ Error creating default admin:", err);
  }
}

// 🔐 Change Password (for logged-in users)
export async function changePassword(req, res) {
  try {
    const { userId, oldPassword, newPassword } = req.body;

    if (!userId || !oldPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const isStrong =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!isStrong.test(newPassword)) {
      return res.status(400).json({
        message:
          "Password is not strong. Must be 8+ chars, with uppercase, lowercase, number, and special character.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    // ✅ Set plain text password. User.js handles hashing.
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("❌ Change password error:", error);
    res.status(500).json({ message: error.message });
  }
}

export async function getTotalStudentCount(req, res) {
  try {
    const totalCount = await User.countDocuments({ role: "student" });
    res.json({
      message: "Total student count retrieved successfully",
      totalCount: totalCount,
    });
  } catch (error) {
    console.error("❌ Error fetching total student count:", error);
    res.status(500).json({ message: error.message });
  }
}
