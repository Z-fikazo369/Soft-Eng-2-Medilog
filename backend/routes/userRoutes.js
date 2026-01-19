// File: server/routes/userRoutes.js
import express from "express";
import { protect, isAdmin } from "../middleware/authMiddleware.js";
import { uploadProfilePicture } from "../controllers/userController.js";
import {
  createSystemBackup,
  getBackupList,
  downloadBackup,
  restoreSystem,
} from "../controllers/adminController.js";
import upload from "../config/cloudinary.js";

const router = express.Router();

// 🔍 DEBUG MIDDLEWARE - Add BEFORE the upload route
router.post(
  "/:userId/upload-pfp",
  protect,
  (req, res, next) => {
    console.log("\n🚀 ===== HITTING UPLOAD ROUTE =====");
    console.log("📍 Route:", req.method, req.originalUrl);
    console.log("📄 Content-Type:", req.headers["content-type"]);
    console.log("📦 Body (before multer):", req.body);
    console.log("=====================================\n");
    next();
  },
  upload.single("image"), // ✅ This should parse the file
  uploadProfilePicture
);

// Backup routes...
router.route("/backup/create").post(protect, isAdmin, createSystemBackup);
router.route("/backup/list").get(protect, isAdmin, getBackupList);
router
  .route("/backup/download/:filename")
  .get(protect, isAdmin, downloadBackup);
router.route("/backup/restore").post(protect, isAdmin, restoreSystem);

export default router;
