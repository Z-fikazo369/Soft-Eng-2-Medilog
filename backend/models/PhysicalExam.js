import mongoose from "mongoose";

const physicalExamSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true },

    // Form fields
    name: { type: String, required: true },
    gender: { type: String, required: true },
    course: { type: String, required: true },
    year: { type: String, required: true },
    date: { type: String, required: true },

    // Admin fields
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

export default mongoose.model("PhysicalExam", physicalExamSchema);
