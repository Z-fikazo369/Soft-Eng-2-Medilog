import Notification from "../models/Notification.js";

/**
 * Helper function na tatawagin mula sa medicalRecordController
 */
export const createNotification = async (
  userId,
  message,
  recordId,
  recordType
) => {
  try {
    const notification = new Notification({
      userId,
      message,
      recordId,
      recordType,
      isRead: false,
    });
    await notification.save();
    // Dito pwedeng magdagdag ng Socket.io logic para maging real-time
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

/**
 * API: Kunin lahat ng notifications ng student
 */
export async function getStudentNotifications(req, res) {
  try {
    const { studentId } = req.params;
    const notifications = await Notification.find({ userId: studentId })
      .sort({ createdAt: -1 }) // Pinakabago muna
      .limit(50); // Kunin 'yung huling 50
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * API: Kunin 'yung bilang ng HINDI PA NABABASA (para sa badge)
 */
export async function getUnreadCount(req, res) {
  try {
    const { studentId } = req.params;
    const count = await Notification.countDocuments({
      userId: studentId,
      isRead: false,
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * API: Markahin lahat bilang "read"
 */
export async function markNotificationsAsRead(req, res) {
  try {
    const { studentId } = req.params;
    // I-update lahat ng unread (isRead: false) para sa student na 'to
    await Notification.updateMany(
      { userId: studentId, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
