import { nanoid } from "nanoid";
import { User } from "../models/User.js";
import { isMongoReady } from "../db/connect.js";
import { hashPassword, verifyPassword } from "../utils/authSecurity.js";
import { createHttpError, normalizeEmail, normalizeText } from "../utils/storyUtils.js";

const memoryUsers = [];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function toPlainUser(user) {
  return user?.toObject ? user.toObject({ virtuals: true }) : clone(user);
}

function publicUser(user) {
  const safe = toPlainUser(user);
  delete safe.passwordHash;
  delete safe._id;
  delete safe.__v;
  return safe;
}

function validateSignup(payload = {}) {
  const email = normalizeEmail(payload.email);
  const phone = normalizeText(payload.phone || payload.number);
  const password = String(payload.password || "");

  if (!email || !email.includes("@")) {
    throw createHttpError(400, "A valid email is required");
  }
  if (!phone) {
    throw createHttpError(400, "Phone number is required");
  }
  if (password.length < 8) {
    throw createHttpError(400, "Password must be at least 8 characters");
  }

  return { email, phone, password };
}

export async function createUserAccount(payload = {}) {
  const { email, phone, password } = validateSignup(payload);
  const username = normalizeText(payload.username);
  const displayName = normalizeText(payload.displayName || payload.name || username);

  if (isMongoReady()) {
    const existing = await User.findOne({ email });
    if (existing) {
      throw createHttpError(409, "An account with this email already exists");
    }

    const created = await User.create({
      userId: `USR-${nanoid(10).toUpperCase()}`,
      email,
      phone,
      username,
      displayName,
      passwordHash: hashPassword(password)
    });
    return publicUser(created);
  }

  if (memoryUsers.some((user) => user.email === email)) {
    throw createHttpError(409, "An account with this email already exists");
  }

  const user = {
    userId: `USR-${nanoid(10).toUpperCase()}`,
    email,
    phone,
    username,
    displayName,
    role: "registered_user",
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  memoryUsers.push(user);
  return publicUser(user);
}

export async function authenticateUser(payload = {}) {
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || "");

  if (!email || !password) {
    throw createHttpError(400, "Email and password are required");
  }

  const user = isMongoReady()
    ? await User.findOne({ email })
    : memoryUsers.find((item) => item.email === email);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw createHttpError(401, "Invalid email or password");
  }

  return publicUser(user);
}

export async function getUserById(userId) {
  if (!userId) {
    return null;
  }

  const user = isMongoReady()
    ? await User.findOne({ userId })
    : memoryUsers.find((item) => item.userId === userId);

  return user ? publicUser(user) : null;
}
