import mongoose from "mongoose";
import { CONTENT_STATUSES } from "../config/constants.js";

const podcastCommentSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Listener", trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true
    }
  },
  { timestamps: true }
);

const podcastSchema = new mongoose.Schema(
  {
    podcastId: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    audioUrl: { type: String, trim: true },
    coverImageUrl: { type: String, trim: true },
    linkedStoryId: { type: String, trim: true, index: true },
    uncoveredNote: { type: String, trim: true },
    status: {
      type: String,
      enum: CONTENT_STATUSES,
      default: "draft",
      index: true
    },
    showInLatest: { type: Boolean, default: false, index: true },
    latestExpiresAt: { type: Date, index: true },
    publishedAt: Date,
    stats: {
      listens: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      favorites: { type: Number, default: 0 },
      shares: { type: Number, default: 0 }
    },
    comments: [podcastCommentSchema]
  },
  { timestamps: true }
);

podcastSchema.index({ title: "text", description: "text", linkedStoryId: "text" });

export const Podcast =
  mongoose.models.Podcast || mongoose.model("Podcast", podcastSchema);
