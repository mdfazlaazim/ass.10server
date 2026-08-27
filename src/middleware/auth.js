import User from "../models/User.js";

export const syncUserProfile = async (sessionUser) => {
  if (!sessionUser?.id) return null;

  let user = await User.findOne({ authId: sessionUser.id });

  if (!user) {
    user = await User.findOne({ email: sessionUser.email });
  }

  if (!user) {
    user = await User.create({
      authId: sessionUser.id,
      name: sessionUser.name || "User",
      email: sessionUser.email,
      photoURL: sessionUser.image || sessionUser.photoURL || "",
      isPremium: sessionUser.isPremium || false,
      role: sessionUser.role || "user",
    });
  } else {
    user.name = sessionUser.name || user.name;
    user.photoURL = sessionUser.image || sessionUser.photoURL || user.photoURL;
    user.authId = sessionUser.id;
    await user.save();
  }

  return user;
};

export const verifyToken = async (req, res, next) => {
  try {
    const { getAuth } = await import("../auth/auth.js");
    const auth = await getAuth();

    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return res.status(401).json({ message: "Unauthorized - Please login" });
    }

    const dbUser = await syncUserProfile(session.user);
    req.user = dbUser;
    req.session = session;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const { getAuth } = await import("../auth/auth.js");
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: req.headers });

    if (session?.user) {
      req.user = await syncUserProfile(session.user);
      req.session = session;
    }
    next();
  } catch {
    next();
  }
};

export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

export const isPremium = (req, res, next) => {
  if (!req.user?.isPremium) {
    return res.status(403).json({ message: "Premium subscription required" });
  }
  next();
};
