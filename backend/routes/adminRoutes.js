// File: server/routes/adminRoutes.js (FINAL CORRECT VERSION)

import express from "express";
// ✅ FIXED: I-import ang 'protect' at 'isAdmin'
import { protect, isAdmin } from "../middleware/authMiddleware.js";
import {
  createSystemBackup,
  getBackupList,
  downloadBackup,
  restoreSystem,
} from "../controllers/adminController.js";

const router = express.Router();

// Ang base path ay /api/users (na dinefine sa server.js)

// 1. CREATE SYSTEM BACKUP: POST /api/users/backup/create
// Kailangan muna i-verify ang token (protect), tapos i-check kung admin (isAdmin)
router.post("/backup/create", protect, isAdmin, createSystemBackup);

// 2. GET BACKUP LIST: GET /api/users/backup/list
router.get("/backup/list", protect, isAdmin, getBackupList);

// 3. DOWNLOAD BACKUP: GET /api/users/backup/download/:filename
router.get("/backup/download/:filename", protect, isAdmin, downloadBackup);

// 4. RESTORE SYSTEM (Disabled): POST /api/users/backup/restore
router.post("/backup/restore", protect, isAdmin, restoreSystem);

export default router;
