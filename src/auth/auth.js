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

  const trustedOrigins = [process.env.CLIENT_URL].filter(Boolean);

  authInstance = betterAuth({
    database: mongodbAdapter(db),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: trustedOrigins.length > 0 ? trustedOrigins : ["http://localhost:3000"],
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
