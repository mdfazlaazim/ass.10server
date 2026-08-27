import express from "express";
import User from "../models/User.js";
import Lesson from "../models/Lesson.js";
import LessonReport from "../models/LessonReport.js";
import Favorite from "../models/Favorite.js";
import Comment from "../models/Comment.js";
import { verifyToken, isAdmin } from "../middleware/auth.js";

const router = express.Router();

router.use(verifyToken, isAdmin);

router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPublicLessons = await Lesson.countDocuments({ visibility: "Public" });
    const totalReported = await LessonReport.countDocuments();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayLessons = await Lesson.countDocuments({ createdAt: { $gte: todayStart } });

    const activeContributors = await Lesson.aggregate([
      { $group: { _id: "$creatorId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const userIds = activeContributors.map((c) => c._id);
    const users = await User.find({ _id: { $in: userIds } }).select("name email photoURL");
    const contributors = activeContributors.map((c) => {
      const user = users.find((u) => u._id.toString() === c._id.toString());
      return { ...user?.toObject(), lessonCount: c.count };
    });

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const lessonCount = await Lesson.countDocuments({
        createdAt: { $gte: start, $lte: end },
      });
      const userCount = await User.countDocuments({
        createdAt: { $gte: start, $lte: end },
      });

      months.push({
        month: start.toLocaleString("default", { month: "short" }),
        lessons: lessonCount,
        users: userCount,
      });
    }

    res.json({
      totalUsers,
      totalPublicLessons,
      totalReported,
      todayLessons,
      contributors,
      growthChart: months,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-authId").sort({ createdAt: -1 });
    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        const lessonCount = await Lesson.countDocuments({ creatorId: user._id });
        return { ...user.toObject(), lessonCount };
      })
    );
    res.json(usersWithCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-authId");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    await Lesson.deleteMany({ creatorId: req.params.id });
    await Favorite.deleteMany({ userId: req.params.id });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/lessons", async (req, res) => {
  try {
    const { category, visibility, flagged } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (visibility) filter.visibility = visibility;

    let lessons = await Lesson.find(filter)
      .populate("creatorId", "name email photoURL")
      .sort({ createdAt: -1 });

    if (flagged === "true") {
      const reportedIds = await LessonReport.distinct("lessonId");
      lessons = lessons.filter((l) =>
        reportedIds.some((id) => id.toString() === l._id.toString())
      );
    }

    const publicCount = await Lesson.countDocuments({ visibility: "Public" });
    const privateCount = await Lesson.countDocuments({ visibility: "Private" });
    const flaggedCount = (await LessonReport.distinct("lessonId")).length;

    res.json({ lessons, stats: { publicCount, privateCount, flaggedCount } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/lessons/:id/featured", async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });
    lesson.isFeatured = !lesson.isFeatured;
    await lesson.save();
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/lessons/:id/reviewed", async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });
    lesson.isReviewed = true;
    await lesson.save();
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/lessons/:id", async (req, res) => {
  try {
    await Favorite.deleteMany({ lessonId: req.params.id });
    await Comment.deleteMany({ lessonId: req.params.id });
    await LessonReport.deleteMany({ lessonId: req.params.id });
    await Lesson.findByIdAndDelete(req.params.id);
    res.json({ message: "Lesson deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/reported", async (req, res) => {
  try {
    const reports = await LessonReport.find()
      .populate("lessonId", "title")
      .populate("reporterUserId", "name email photoURL")
      .sort({ timestamp: -1 });

    const grouped = {};
    reports.forEach((report) => {
      const lessonId = report.lessonId?._id?.toString();
      if (!lessonId) return;
      if (!grouped[lessonId]) {
        grouped[lessonId] = {
          lessonId,
          lessonTitle: report.lessonId.title,
          reportCount: 0,
          reports: [],
        };
      }
      grouped[lessonId].reportCount += 1;
      grouped[lessonId].reports.push(report);
    });

    res.json(Object.values(grouped));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/reported/:lessonId/ignore", async (req, res) => {
  try {
    await LessonReport.deleteMany({ lessonId: req.params.lessonId });
    res.json({ message: "Reports cleared" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
