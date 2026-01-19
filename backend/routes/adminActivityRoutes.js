import express from "express";
import {
  logAdminActivity,
  getAdminActivityLogs,
  getAdminActivitySummary,
} from "../controllers/adminActivityController.js";

// I-import ang security middleware
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Log admin activity (Client sends activity data after completing an action)
router.post("/activity-logs", protect, isAdmin, logAdminActivity);

// Get all activity logs with filtering
router.get("/activity-logs", protect, isAdmin, getAdminActivityLogs);

// Get activity summary
router.get("/activity-logs/summary", protect, isAdmin, getAdminActivitySummary);

export default router;
