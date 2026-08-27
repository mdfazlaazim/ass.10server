import express from "express";
import Favorite from "../models/Favorite.js";
import Lesson from "../models/Lesson.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
  try {
    const { category, emotionalTone } = req.query;
    const filter = { userId: req.user._id };

    const favorites = await Favorite.find(filter)
      .populate({
        path: "lessonId",
        populate: { path: "creatorId", select: "name email photoURL" },
      })
      .sort({ savedAt: -1 });

    let result = favorites.filter((f) => f.lessonId);

    if (category) {
      result = result.filter((f) => f.lessonId.category === category);
    }
    if (emotionalTone) {
      result = result.filter((f) => f.lessonId.emotionalTone === emotionalTone);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:lessonId", verifyToken, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    const existing = await Favorite.findOne({
      userId: req.user._id,
      lessonId: req.params.lessonId,
    });

    if (existing) {
      await Favorite.findByIdAndDelete(existing._id);
      lesson.favoritesCount = Math.max(0, lesson.favoritesCount - 1);
      await lesson.save();
      return res.json({ saved: false, favoritesCount: lesson.favoritesCount });
    }

    await Favorite.create({
      userId: req.user._id,
      lessonId: req.params.lessonId,
    });
    lesson.favoritesCount += 1;
    await lesson.save();

    res.json({ saved: true, favoritesCount: lesson.favoritesCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/check/:lessonId", verifyToken, async (req, res) => {
  try {
    const favorite = await Favorite.findOne({
      userId: req.user._id,
      lessonId: req.params.lessonId,
    });
    res.json({ saved: !!favorite });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/count", verifyToken, async (req, res) => {
  try {
    const count = await Favorite.countDocuments({ userId: req.user._id });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
