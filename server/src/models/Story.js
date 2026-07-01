import mongoose from "mongoose";
import {
  PUBLISHING_IDENTITIES,
  STORY_CATEGORIES,
  STORY_FORMATS,
  STORY_INTENTS,
  STORY_UPDATE_TYPES,
  STORY_STATUSES,
  VERIFICATION_LABELS,
  VOICE_TREATMENTS
} from "../config/constants.js";

const evidenceSchema = new mongoose.Schema(
  {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String,
    description: { type: String, trim: true },
    supportsLine: { type: String, trim: true },
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const audioSchema = new mongoose.Schema(
  {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String,
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const updateSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: STORY_UPDATE_TYPES,
      default: "missing_point"
    },
    referenceLine: { type: String, trim: true },
    suggestedWording: { type: String, trim: true },
    body: { type: String, required: true, trim: true },
    authorUserId: { type: String, trim: true },
    authorEmail: { type: String, trim: true, lowercase: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true
    },
    moderatorNote: String
  },
  { timestamps: true }
);

const commentSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Reader", trim: true },
    message: { type: String, required: true, trim: true },
    helpful: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true
    }
  },
  { timestamps: true }
);

const adviceSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Community member", trim: true },
    message: { type: String, required: true, trim: true },
    helpful: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true
    }
  },
  { timestamps: true }
);

const moderationHistorySchema = new mongoose.Schema(
  {
    action: String,
    actor: String,
    note: String,
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const storySchema = new mongoose.Schema(
  {
    storyId: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    imageUrl: { type: String, trim: true },
    category: {
      type: String,
      enum: STORY_CATEGORIES,
      required: true,
      index: true
    },
    intent: {
      type: String,
      enum: STORY_INTENTS,
      default: "Share experience",
      index: true
    },
    body: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    regionCity: { type: String, trim: true },
    happenedAt: { type: String, trim: true },
    urgency: {
      type: String,
      enum: ["low", "normal", "high", "asap"],
      default: "normal",
      index: true
    },
    submissionType: {
      type: String,
      enum: ["anonymous", "public"],
      default: "anonymous"
    },
    publishingPreference: {
      type: String,
      enum: PUBLISHING_IDENTITIES,
      default: "anonymous"
    },
    submissionMode: {
      type: String,
      enum: ["account", "anonymous_guest"],
      default: "anonymous_guest",
      index: true
    },
    authorUserId: { type: String, trim: true, index: true },
    authorEmail: { type: String, trim: true, lowercase: true },
    authorPhone: { type: String, trim: true },
    accountUsername: { type: String, trim: true },
    displayName: { type: String, trim: true },
    faceless: { type: Boolean, default: true, index: true },
    storyInputTypes: [{ type: String, enum: ["typed", "audio"] }],
    storyAudio: audioSchema,
    requestedFormats: [{ type: String, enum: STORY_FORMATS }],
    voiceTreatment: {
      type: String,
      enum: VOICE_TREATMENTS,
      default: "read_as_submitted"
    },
    characterName: { type: String, trim: true },
    changeDetails: { type: String, trim: true },
    sensitiveFlags: [{ type: String }],
    contact: {
      name: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      phone: { type: String, trim: true },
      whatsapp: { type: String, trim: true },
      preferredMethod: { type: String, trim: true, default: "email" }
    },
    consents: {
      terms: { type: Boolean, default: false },
      publish: { type: Boolean, default: false },
      contact: { type: Boolean, default: false },
      sensitive: { type: Boolean, default: false }
    },
    evidence: [evidenceSchema],
    status: {
      type: String,
      enum: STORY_STATUSES,
      default: "submitted",
      index: true
    },
    verificationLabel: {
      type: String,
      enum: VERIFICATION_LABELS,
      default: "unverified",
      index: true
    },
    featured: { type: Boolean, default: false, index: true },
    pinned: { type: Boolean, default: false, index: true },
    showInLatest: { type: Boolean, default: false, index: true },
    latestExpiresAt: { type: Date, index: true },
    solved: { type: Boolean, default: false, index: true },
    stats: {
      views: { type: Number, default: 0 },
      helpful: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      follows: { type: Number, default: 0 },
      favorites: { type: Number, default: 0 },
      bookmarks: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      reports: { type: Number, default: 0 }
    },
    updates: [updateSchema],
    comments: [commentSchema],
    advice: [adviceSchema],
    moderation: {
      assignedTo: { type: String, trim: true },
      requestedInfo: { type: String, trim: true },
      notes: { type: String, trim: true },
      publishSafety: {
        identityReviewed: { type: Boolean, default: false },
        contactHidden: { type: Boolean, default: false },
        evidencePrivate: { type: Boolean, default: false },
        namesChanged: { type: Boolean, default: false },
        locationsChanged: { type: Boolean, default: false },
        consentReviewed: { type: Boolean, default: false }
      },
      history: [moderationHistorySchema]
    },
    publishedAt: Date
  },
  { timestamps: true }
);

storySchema.index({ title: "text", body: "text", category: "text", country: "text" });

export const Story = mongoose.models.Story || mongoose.model("Story", storySchema);
