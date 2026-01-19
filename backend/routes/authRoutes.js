import express from "express";
import rateLimit from "express-rate-limit";
import {
  signup,
  verifyOTP,
  login,
  resendOTP,
  forgotPassword,
  resetPassword,
  getPendingAccounts,
  approveAccount,
  rejectAccount,
  getAllStudentAccounts,
  changePassword,
  getTotalStudentCount, // 👈 IDINAGDAG: Para sa Total Student Count
} from "../controllers/authController.js";

// ✅ (1) I-IMPORT 'YUNG UPLOAD CONFIG (gaya ng sa userRoutes.js)
import upload from "../config/cloudinary.js";

// Import security middleware (Assuming ito 'yung ginawa natin sa Turn 40)
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Rule para sa mga endpoint na nagpapadala ng OTP
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  message: {
    message:
      "Too many OTP requests from this IP. Please try again after 5 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rule para sa login attempts
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  message: {
    message: "Too many login attempts. Your IP has been locked for 5 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ✅ (2) I-UPDATE 'YUNG SIGNUP ROUTE PARA TUMANGGAP NG FILE
router.post("/users", upload.single("idPicture"), signup);

router.post("/verify-otp", verifyOTP);

// I-apply ang mga limiter sa routes
router.post("/login", loginLimiter, login);
router.post("/resend-otp", otpLimiter, resendOTP);
router.post("/forgot-password", otpLimiter, forgotPassword);
router.post("/reset-password", resetPassword);
// I-apply ang protect middleware dito (assuming ito ay para sa logged-in users)
router.post("/users/change-password", protect, changePassword);

// --- Admin account management routes (May security na dapat ito) ---
// Note: Assuming na na-apply mo na ang protect at isAdmin sa file na 'to based sa Turn 40
router.get("/accounts/pending", protect, isAdmin, getPendingAccounts);
router.get("/accounts/all", protect, isAdmin, getAllStudentAccounts);
router.post("/accounts/:userId/approve", protect, isAdmin, approveAccount);
router.post("/accounts/:userId/reject", protect, isAdmin, rejectAccount);

// ✅ BAGO: Route para sa Total Student Count
router.get("/accounts/total", protect, isAdmin, getTotalStudentCount);

export default router;
