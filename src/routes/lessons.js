import express from "express";
import Lesson from "../models/Lesson.js";
import Favorite from "../models/Favorite.js";
import User from "../models/User.js";
import { verifyToken, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

const populateCreator = {
  path: "creatorId",
  select: "name email photoURL isPremium role",
};

router.get("/featured", async (req, res) => {
  try {
    const lessons = await Lesson.find({ isFeatured: true, visibility: "Public" })
      .populate(populateCreator)
      .sort({ createdAt: -1 })
      .limit(6);
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/top-contributors", async (req, res) => {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const contributors = await Lesson.aggregate([
      { $match: { createdAt: { $gte: weekAgo } } },
      { $group: { _id: "$creatorId", lessonCount: { $sum: 1 } } },
      { $sort: { lessonCount: -1 } },
      { $limit: 6 },
    ]);

    const userIds = contributors.map((c) => c._id);
    const users = await User.find({ _id: { $in: userIds } }).select(
      "name email photoURL"
    );

    const result = contributors.map((c) => {
      const user = users.find((u) => u._id.toString() === c._id.toString());
      return { ...user?.toObject(), lessonCount: c.lessonCount };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/most-saved", async (req, res) => {
  try {
    const lessons = await Lesson.find({ visibility: "Public" })
      .populate(populateCreator)
      .sort({ favoritesCount: -1 })
      .limit(6);
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/public", optionalAuth, async (req, res) => {
  try {
    const {
      category,
      emotionalTone,
      search,
      sort = "newest",
      page = 1,
      limit = 9,
    } = req.query;

    const filter = { visibility: "Public" };

    if (category) filter.category = category;
    if (emotionalTone) filter.emotionalTone = emotionalTone;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === "most-saved") sortOption = { favoritesCount: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Lesson.countDocuments(filter);
    const lessons = await Lesson.find(filter)
      .populate(populateCreator)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      lessons,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const lessons = await Lesson.find({
      creatorId: req.params.userId,
      visibility: "Public",
    })
      .populate(populateCreator)
      .sort({ createdAt: -1 });
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate(populateCreator);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    if (lesson.visibility === "Private") {
      const isOwner = req.user && req.user._id.toString() === lesson.creatorId._id.toString();
      const isAdmin = req.user && req.user.role === "admin";
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "This lesson is private" });
      }
    }

    const creatorLessonCount = await Lesson.countDocuments({
      creatorId: lesson.creatorId._id,
    });

    lesson.viewsCount = (lesson.viewsCount || 0) + 1;
    await lesson.save();

    const isPremiumLocked =
      lesson.accessLevel === "Premium" &&
      (!req.user || (!req.user.isPremium && req.user._id.toString() !== lesson.creatorId._id.toString()));

    res.json({
      lesson,
      creatorLessonCount,
      isPremiumLocked,
      isLiked: req.user ? lesson.likes.some((id) => id.toString() === req.user._id.toString()) : false,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id/similar", async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    const similar = await Lesson.find({
      _id: { $ne: lesson._id },
      visibility: "Public",
      $or: [{ category: lesson.category }, { emotionalTone: lesson.emotionalTone }],
    })
      .populate(populateCreator)
      .limit(6);

    res.json(similar);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", verifyToken, async (req, res) => {
  try {
    const { title, description, category, emotionalTone, image, visibility, accessLevel } = req.body;

    const finalAccessLevel =
      accessLevel === "Premium" && req.user.isPremium ? "Premium" : "Free";

    const lesson = await Lesson.create({
      title,
      description,
      category,
      emotionalTone,
      image: image || "",
      visibility: visibility || "Private",
      accessLevel: finalAccessLevel,
      creatorId: req.user._id,
    });

    res.status(201).json(lesson);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/my/all", verifyToken, async (req, res) => {
  try {
    const lessons = await Lesson.find({ creatorId: req.user._id }).sort({ createdAt: -1 });
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", verifyToken, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    const isOwner = lesson.creatorId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to edit this lesson" });
    }

    const { title, description, category, emotionalTone, image, visibility, accessLevel } = req.body;

    if (title) lesson.title = title;
    if (description) lesson.description = description;
    if (category) lesson.category = category;
    if (emotionalTone) lesson.emotionalTone = emotionalTone;
    if (image !== undefined) lesson.image = image;
    if (visibility) lesson.visibility = visibility;
    if (accessLevel) {
      lesson.accessLevel =
        accessLevel === "Premium" && req.user.isPremium ? "Premium" : "Free";
    }

    await lesson.save();
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    const isOwner = lesson.creatorId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this lesson" });
    }

    await Favorite.deleteMany({ lessonId: lesson._id });
    await Lesson.findByIdAndDelete(req.params.id);
    res.json({ message: "Lesson deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:id/like", verifyToken, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    const userId = req.user._id;
    const likedIndex = lesson.likes.findIndex((id) => id.toString() === userId.toString());

    if (likedIndex > -1) {
      lesson.likes.splice(likedIndex, 1);
      lesson.likesCount = Math.max(0, lesson.likesCount - 1);
    } else {
      lesson.likes.push(userId);
      lesson.likesCount += 1;
    }

    await lesson.save();
    res.json({
      likesCount: lesson.likesCount,
      isLiked: likedIndex === -1,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
