import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

let authInstance = null;

export const getAuth = async () => {
  if (authInstance) return authInstance;

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();

  authInstance = betterAuth({
    database: mongodbAdapter(db),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: [process.env.CLIENT_URL],
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
