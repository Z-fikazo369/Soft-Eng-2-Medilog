import mongoose from "mongoose";

const medicalMonitoringSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true },

    // Form fields (Student fills)
    arrival: { type: String, required: true },
    patientName: { type: String, required: true },
    sex: { type: String, required: true },
    degree: { type: String, required: true },
    studentNo: { type: String, required: true },
    symptoms: { type: String, required: true },
    action: { type: String, required: true },

    // Admin-only fields
    meds: { type: String }, // Medications/Treatment
    exit: { type: String }, // Time of Exit
    duration: { type: String }, // Duration of Service
    personnel: { type: String }, // Attending Medical Personnel

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedDate: { type: Date },
    adminNotes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("MedicalMonitoring", medicalMonitoringSchema);
