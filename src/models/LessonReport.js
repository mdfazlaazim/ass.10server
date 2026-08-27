import mongoose from "mongoose";

const lessonReportSchema = new mongoose.Schema(
  {
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", required: true },
    reporterUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reportedUserEmail: { type: String },
    reason: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("LessonReport", lessonReportSchema);
