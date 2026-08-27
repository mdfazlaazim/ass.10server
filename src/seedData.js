import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/db.js";
import User from "./models/User.js";
import Lesson from "./models/Lesson.js";
import Comment from "./models/Comment.js";
import Favorite from "./models/Favorite.js";
import LessonReport from "./models/LessonReport.js";

const seedData = async () => {
  try {
    await connectDB();
    console.log("Connected to DB for seeding...");

    // Clear existing sample collections (optional)
    await User.deleteMany({});
    await Lesson.deleteMany({});
    await Comment.deleteMany({});
    await Favorite.deleteMany({});
    await LessonReport.deleteMany({});

    console.log("Cleared old data.");

    // Create Admin and Standard Users
    const admin = await User.create({
      name: "System Admin",
      email: "admin@digitallife.com",
      photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      role: "admin",
      isPremium: true,
    });

    const user1 = await User.create({
      name: "Sophia Chen",
      email: "sophia@example.com",
      photoURL: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      role: "user",
      isPremium: true,
    });

    const user2 = await User.create({
      name: "Marcus Vance",
      email: "marcus@example.com",
      photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      role: "user",
      isPremium: false,
    });

    const user3 = await User.create({
      name: "Elena Rostova",
      email: "elena@example.com",
      photoURL: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
      role: "user",
      isPremium: true,
    });

    console.log("Users seeded.");

    // Create Lessons
    const lessonsData = [
      {
        title: "Embracing Failure as a Stepping Stone to Mastery",
        description:
          "For years I viewed setbacks as proof that I wasn't cut out for my career goals. When a high-stakes startup project collapsed in 2023, I was devastated. But sitting with that failure taught me resilience. Failure isn't the opposite of success; it's an essential part of the process. Documenting what went wrong turned a disaster into my greatest learning experience.",
        category: "Career",
        emotionalTone: "Realization",
        image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800",
        visibility: "Public",
        accessLevel: "Free",
        creatorId: user1._id,
        likes: [user2._id, user3._id],
        likesCount: 2,
        favoritesCount: 3,
        isFeatured: true,
        isReviewed: true,
        viewsCount: 1420,
      },
      {
        title: "The Power of Daily Gratitude in Overcoming Burnout",
        description:
          "Working 70-hour weeks left me emotionally exhausted. A friend suggested keeping a simple night note: writing three specific things I was grateful for each evening. Within a month, my mental perspective shifted. Gratitude didn't lessen my workload, but it reclaimed my sense of joy.",
        category: "Personal Growth",
        emotionalTone: "Gratitude",
        image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800",
        visibility: "Public",
        accessLevel: "Free",
        creatorId: user3._id,
        likes: [user1._id, user2._id, admin._id],
        likesCount: 3,
        favoritesCount: 5,
        isFeatured: true,
        isReviewed: true,
        viewsCount: 2890,
      },
      {
        title: "Mastering the Art of Honest Boundaries in Relationships",
        description:
          "Saying 'yes' to everyone else meant constantly saying 'no' to my own health and peace of mind. Learning to establish boundaries with kindness and firmness transformed my relationships. True friends respect your limits.",
        category: "Relationships",
        emotionalTone: "Motivational",
        image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800",
        visibility: "Public",
        accessLevel: "Premium",
        creatorId: user1._id,
        likes: [user3._id],
        likesCount: 1,
        favoritesCount: 2,
        isFeatured: true,
        isReviewed: true,
        viewsCount: 980,
      },
      {
        title: "Why Imposter Syndrome is Actually a Sign of Growth",
        description:
          "Whenever you step out of your comfort zone into a challenging new environment, your brain warns you that you don't belong. Recognizing imposter syndrome as a signal of expansion rather than inadequacy changed how I approach leadership.",
        category: "Mindset",
        emotionalTone: "Motivational",
        image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800",
        visibility: "Public",
        accessLevel: "Free",
        creatorId: user2._id,
        likes: [user1._id],
        likesCount: 1,
        favoritesCount: 4,
        isFeatured: false,
        isReviewed: true,
        viewsCount: 1650,
      },
      {
        title: "The Hardest Financial Lesson I Learned in My 20s",
        description:
          "Confusing lifestyle inflation with success led me to burn through savings on things I didn't need to impress people I didn't like. Rebuilding financial security required humbling myself and prioritizing freedom over appearance.",
        category: "Mistakes Learned",
        emotionalTone: "Sad",
        image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800",
        visibility: "Public",
        accessLevel: "Free",
        creatorId: user3._id,
        likes: [user1._id, user2._id],
        likesCount: 2,
        favoritesCount: 2,
        isFeatured: false,
        isReviewed: true,
        viewsCount: 1100,
      },
      {
        title: "Deep Focus in a Distracted World: Lessons from 100 Days Offline",
        description:
          "Cutting out endless social feeds allowed me to complete my book draft and rediscover quiet reflection. Continuous focus is a muscle that must be cultivated intentionally.",
        category: "Mindset",
        emotionalTone: "Realization",
        image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800",
        visibility: "Public",
        accessLevel: "Premium",
        creatorId: user1._id,
        likes: [user3._id],
        likesCount: 1,
        favoritesCount: 6,
        isFeatured: true,
        isReviewed: true,
        viewsCount: 3100,
      },
    ];

    const lessons = await Lesson.insertMany(lessonsData);
    console.log("Lessons seeded.");

    // Create Favorites
    await Favorite.create({ userId: user2._id, lessonId: lessons[0]._id });
    await Favorite.create({ userId: user2._id, lessonId: lessons[1]._id });
    await Favorite.create({ userId: user1._id, lessonId: lessons[1]._id });
    await Favorite.create({ userId: user3._id, lessonId: lessons[0]._id });

    // Create Comments
    await Comment.create({
      lessonId: lessons[0]._id,
      userId: user2._id,
      text: "This spoke deeply to me. Thank you for sharing your experience!",
    });
    await Comment.create({
      lessonId: lessons[1]._id,
      userId: user1._id,
      text: "Gratitude journaling truly is a game changer for burnout prevention.",
    });

    // Create Sample Report for Admin testing
    await LessonReport.create({
      lessonId: lessons[4]._id,
      reporterUserId: user1._id,
      reportedUserEmail: user1.email,
      reason: "Inappropriate Content",
    });

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

seedData();
