import mongoose from "mongoose";

const medicalCertificateSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true },

    // Form fields (Student fills)
    name: { type: String, required: true },
    age: { type: String, required: true },
    sex: { type: String, required: true },
    civilStatus: { type: String, required: true },
    school: { type: String, required: true },
    idNumber: { type: String, required: true },
    date: { type: String, required: true },

    // Admin-only fields
    diagnosis: { type: String },
    remarks: { type: String },

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

export default mongoose.model("MedicalCertificate", medicalCertificateSchema);
