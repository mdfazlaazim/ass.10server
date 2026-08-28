import mongoose from "mongoose";

let cachedPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (!cachedPromise) {
    cachedPromise = mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    await cachedPromise;
    console.log("MongoDB connected successfully");
  } catch (error) {
    cachedPromise = null;
    console.error("MongoDB connection error:", error.message);
    throw error;
  }

  return mongoose.connection;
};

export default connectDB;
