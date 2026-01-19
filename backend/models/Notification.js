import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      // Para kanino 'yung notification
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    message: {
      // e.g., "Your Medical Certificate has been approved."
      type: String,
      required: true,
    },
    recordId: {
      // 'Yung ID ng form na na-update
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    recordType: {
      // e.g., 'physicalExam', 'monitoring', 'certificate'
      type: String,
      required: true,
    },
    isRead: {
      // Para sa badge count
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
