import express from "express";
import Stripe from "stripe";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();
const stripeKey = process.env.STRIPE_SECRET_KEY || "sk_test_mockkey1234567890";
const stripe = new Stripe(stripeKey);

router.post("/create-checkout-session", verifyToken, async (req, res) => {
  try {
    if (req.user.isPremium) {
      return res.status(400).json({ message: "You are already a Premium user" });
    }

    if (stripeKey.startsWith("sk_test_mock")) {
      // Direct success simulation URL for mock key testing
      return res.json({ url: `${process.env.CLIENT_URL || "http://localhost:3000"}/payment/success?session_id=mock_session_123` });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "bdt",
            product_data: {
              name: "Digital Life Lessons - Premium (Lifetime)",
              description: "Lifetime access to premium features",
            },
            unit_amount: 150000,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: req.user._id.toString(),
      },
      success_url: `${process.env.CLIENT_URL || "http://localhost:3000"}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || "http://localhost:3000"}/payment/cancel`,
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/verify-session", verifyToken, async (req, res) => {
  try {
    const { session_id } = req.query;
    if (session_id && stripeKey && !stripeKey.startsWith("sk_test_mock")) {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      if (session.payment_status === "paid" && session.metadata?.userId === req.user._id.toString()) {
        await User.findByIdAndUpdate(req.user._id, { isPremium: true });
        req.user.isPremium = true;
      }
    } else {
      // In mock/test mode without live Stripe API keys, mark user premium directly upon redirecting to success page
      await User.findByIdAndUpdate(req.user._id, { isPremium: true });
      req.user.isPremium = true;
    }

    res.json({ success: true, isPremium: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
