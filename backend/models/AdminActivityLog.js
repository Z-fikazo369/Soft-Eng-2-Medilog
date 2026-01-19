import mongoose from "mongoose";

const adminActivityLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    adminEmail: { type: String, required: true },
    adminUsername: { type: String, required: true },
    action: {
      type: String,
      enum: [
        "LOGIN",
        "LOGOUT",
        "VIEW_RECORDS",
        "CREATE_RECORD",
        "UPDATE_RECORD",
        "DELETE_RECORD",
        "APPROVE_ACCOUNT",
        "REJECT_ACCOUNT",
        "BULK_DELETE_RECORDS",
        "BULK_UPDATE_STATUS",
        "EXPORT_RECORDS",
        "CREATE_BACKUP",
        "RESTORE_BACKUP",
        "VIEW_ANALYTICS",
      ],
      required: true,
    },
    actionDetails: {
      recordType: String, // physicalExam, monitoring, certificate
      recordId: String,
      userId: String, // User affected by action
      count: Number, // For bulk operations
      details: String, // Any additional details
    },
    ipAddress: String,
    userAgent: String,
    status: {
      type: String,
      enum: ["success", "failed"],
      default: "success",
    },
  },
  { timestamps: true }
);

export default mongoose.model("AdminActivityLog", adminActivityLogSchema);
