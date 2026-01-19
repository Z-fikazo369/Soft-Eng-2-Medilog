import express from "express";
import {
  getStudentNotifications,
  getUnreadCount,
  markNotificationsAsRead,
} from "../controllers/notificationController.js";

const router = express.Router();

// Kunin lahat ng notifications (para sa "Notifications" page)
router.get("/notifications/student/:studentId", getStudentNotifications);

// Kunin 'yung count (para sa badge)
router.get("/notifications/student/:studentId/unread-count", getUnreadCount);

// I-mark as read (kapag binuksan 'yung page)
router.post(
  "/notifications/student/:studentId/mark-read",
  markNotificationsAsRead
);

export default router;
