import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    photoURL: { type: String, default: "" },
    isPremium: { type: Boolean, default: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    authId: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
