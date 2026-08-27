import express from "express";
import LessonReport from "../models/LessonReport.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/:lessonId", verifyToken, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: "Reason is required" });

    const report = await LessonReport.create({
      lessonId: req.params.lessonId,
      reporterUserId: req.user._id,
      reportedUserEmail: req.user.email,
      reason,
    });

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
