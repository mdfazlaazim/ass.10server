import express from "express";
import Comment from "../models/Comment.js";
import { verifyToken, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/lesson/:lessonId", optionalAuth, async (req, res) => {
  try {
    const comments = await Comment.find({ lessonId: req.params.lessonId })
      .populate("userId", "name email photoURL")
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/lesson/:lessonId", verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const comment = await Comment.create({
      lessonId: req.params.lessonId,
      userId: req.user._id,
      text: text.trim(),
    });

    const populated = await Comment.findById(comment._id).populate(
      "userId",
      "name email photoURL"
    );

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
