import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import connectDB from "./config/db.js";
import getAuth from "./auth/auth.js";
import lessonsRouter from "./routes/lessons.js";
import favoritesRouter from "./routes/favorites.js";
import commentsRouter from "./routes/comments.js";
import reportsRouter from "./routes/reports.js";
import usersRouter from "./routes/users.js";
import adminRouter from "./routes/admin.js";
import stripeRouter from "./routes/stripe.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);

app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res, next) => {
    const Stripe = (await import("stripe")).default;
    const User = (await import("./models/User.js")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers["stripe-signature"];

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        if (userId) {
          await User.findByIdAndUpdate(userId, { isPremium: true });
        }
      }

      res.json({ received: true });
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

app.use(express.json());

const startServer = async () => {
  await connectDB();

  const auth = await getAuth();
  app.all("/api/auth/*", toNodeHandler(auth));

  app.get("/", (req, res) => {
    res.json({ message: "Digital Life Lessons API is running" });
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/lessons", lessonsRouter);
  app.use("/api/favorites", favoritesRouter);
  app.use("/api/comments", commentsRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/stripe", stripeRouter);

  app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
  });

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Internal server error" });
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
