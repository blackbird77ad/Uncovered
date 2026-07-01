import { nanoid } from "nanoid";
import slugify from "slugify";

export function createStoryId() {
  return `UC-${new Date().getFullYear()}-${nanoid(8).toUpperCase()}`;
}

export function makeSlug(title, storyId) {
  return slugify(`${title}-${storyId}`, {
    lower: true,
    strict: true,
    trim: true
  }).slice(0, 120);
}

export function normalizeText(value) {
  return String(value || "").trim();
}

export function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

export function parseBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  return ["1", "true", "yes", "on"].includes(String(value || "").toLowerCase());
}

export function parseArray(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeText).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map(normalizeText)
    .filter(Boolean);
}

export function publicStory(story) {
  const safe = JSON.parse(JSON.stringify(story));
  const storyAudio = safe.storyAudio?.filename
    ? {
        audioUrl: `/uploads/${safe.storyAudio.filename}`,
        originalName: safe.storyAudio.originalName,
        mimetype: safe.storyAudio.mimetype,
        size: safe.storyAudio.size,
        uploadedAt: safe.storyAudio.uploadedAt
      }
    : null;

  safe.acceptsAuthorAddUps =
    safe.submissionMode === "account" && Boolean(safe.authorUserId);
  safe.storyAudio = storyAudio;

  delete safe.contact;
  delete safe.consents;
  delete safe.moderation;
  delete safe.authorUserId;
  delete safe.authorEmail;
  delete safe.authorPhone;
  delete safe.submissionMode;

  safe.evidence = (safe.evidence || []).map((item) => ({
    originalName: item.originalName,
    mimetype: item.mimetype,
    size: item.size,
    uploadedAt: item.uploadedAt
  }));

  safe.updates = (safe.updates || [])
    .filter((item) => item.status === "approved")
    .map(({ authorEmail, moderatorNote, ...item }) => item);
  safe.comments = (safe.comments || [])
    .filter((item) => item.status === "approved")
    .map(({ status, ...item }) => item);
  safe.advice = (safe.advice || [])
    .filter((item) => item.status === "approved")
    .map(({ status, ...item }) => item);

  safe.contentType = "story";

  return safe;
}

export function publicPodcast(podcast) {
  const safe = JSON.parse(JSON.stringify(podcast));

  safe.contentType = "podcast";
  safe.comments = (safe.comments || [])
    .filter((item) => item.status === "approved")
    .map(({ status, ...item }) => item);

  return safe;
}

export function isLatestActive(item) {
  if (!item.showInLatest) {
    return false;
  }

  if (!item.latestExpiresAt) {
    return true;
  }

  return new Date(item.latestExpiresAt).getTime() > Date.now();
}

export function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
