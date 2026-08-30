import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

let authInstance = null;
let mongoClientPromise = null;

export const getAuth = async () => {
  if (authInstance) return authInstance;

  if (!mongoClientPromise) {
    const client = new MongoClient(process.env.MONGODB_URI);
    mongoClientPromise = client.connect();
  }
  const client = await mongoClientPromise;
  const db = client.db();

  const extraOrigins = (process.env.BETTER_AUTH_TRUSTED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const trustedOrigins = Array.from(
    new Set(
      [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5000",
        "https://ass-10client.vercel.app",
        "https://ass-10server.vercel.app",
        process.env.CLIENT_URL,
        process.env.BETTER_AUTH_URL,
        "https://*.vercel.app",
        ...extraOrigins,
      ]
        .filter(Boolean)
        .map((url) => {
          try {
            return url.includes("*") ? url : new URL(url).origin;
          } catch {
            return url.replace(/\/$/, "");
          }
        })
    )
  );

  const isProd = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);

  authInstance = betterAuth({
    database: mongodbAdapter(db),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: trustedOrigins.length > 0 ? trustedOrigins : ["http://localhost:3000"],
    advanced: {
      useSecureCookies: isProd,
      defaultCookieAttributes: isProd
        ? {
            sameSite: "none",
            secure: true,
            httpOnly: true,
            partitioned: true,
            path: "/",
          }
        : {
            sameSite: "lax",
            secure: false,
            httpOnly: true,
            path: "/",
          },
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 6,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      },
    },
    user: {
      additionalFields: {
        isPremium: { type: "boolean", defaultValue: false },
        role: { type: "string", defaultValue: "user" },
        photoURL: { type: "string", defaultValue: "" },
      },
    },
  });

  return authInstance;
};

export default getAuth;
