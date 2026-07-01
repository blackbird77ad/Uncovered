import mongoose from "mongoose";
import { env } from "../config/env.js";

export async function connectDatabase() {
  if (!env.mongoUri) {
    console.info("[db] MONGODB_URI not set; using in-memory development store.");
    return false;
  }

  try {
    await mongoose.connect(env.mongoUri);
    console.info("[db] MongoDB connected.");
    return true;
  } catch (error) {
    console.error("[db] MongoDB connection failed; using in-memory store.");
    console.error(error.message);
    return false;
  }
}

export function isMongoReady() {
  return mongoose.connection.readyState === 1;
}
