import express from "express";
import User from "../models/User.js";
import Lesson from "../models/Lesson.js";
import Favorite from "../models/Favorite.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/me", verifyToken, async (req, res) => {
  try {
    const lessonCount = await Lesson.countDocuments({ creatorId: req.user._id });
    const savedCount = await Favorite.countDocuments({ userId: req.user._id });

    res.json({
      ...req.user.toObject(),
      lessonCount,
      savedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/profile/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-authId");
    if (!user) return res.status(404).json({ message: "User not found" });

    const lessonCount = await Lesson.countDocuments({ creatorId: user._id });
    const savedCount = await Favorite.countDocuments({ userId: user._id });

    res.json({ ...user.toObject(), lessonCount, savedCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { name, photoURL } = req.body;
    if (name) req.user.name = name;
    if (photoURL !== undefined) req.user.photoURL = photoURL;
    await req.user.save();

    if (req.session?.user?.id) {
      try {
        const { MongoClient } = await import("mongodb");
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        const db = client.db();
        const updateDoc = {};
        if (name) updateDoc.name = name;
        if (photoURL !== undefined) updateDoc.image = photoURL;
        await db.collection("user").updateOne(
          { id: req.session.user.id },
          { $set: updateDoc }
        );
        await client.close();
      } catch (authErr) {
        console.error("Error syncing better-auth user collection:", authErr);
      }
    }

    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/dashboard-stats", verifyToken, async (req, res) => {
  try {
    const lessonCount = await Lesson.countDocuments({ creatorId: req.user._id });
    const savedCount = await Favorite.countDocuments({ userId: req.user._id });
    const recentLessons = await Lesson.find({ creatorId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const count = await Lesson.countDocuments({
        creatorId: req.user._id,
        createdAt: { $gte: start, $lte: end },
      });

      months.push({
        month: start.toLocaleString("default", { month: "short" }),
        count,
      });
    }

    res.json({ lessonCount, savedCount, recentLessons, monthlyChart: months });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
