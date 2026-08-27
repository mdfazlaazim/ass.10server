import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/db.js";
import User from "./models/User.js";

const seedAdmin = async () => {
  await connectDB();

  const adminEmail = process.env.ADMIN_EMAIL || "admin@digitallife.com";
  const existing = await User.findOne({ email: adminEmail });

  if (!existing) {
    await User.create({
      name: "Admin",
      email: adminEmail,
      photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
      role: "admin",
      isPremium: true,
    });
    console.log(`Admin user created: ${adminEmail}`);
    console.log("Register this email via Better Auth and it will sync with admin role.");
  } else if (existing.role !== "admin") {
    existing.role = "admin";
    existing.isPremium = true;
    await existing.save();
    console.log("Existing user promoted to admin");
  } else {
    console.log("Admin already exists");
  }

  process.exit(0);
};

seedAdmin();
