import { AuditLog } from "../models/AuditLog.js";
import { ContactMessage } from "../models/ContactMessage.js";
import { Podcast } from "../models/Podcast.js";
import { Story } from "../models/Story.js";
import {
  CONTENT_STATUSES,
  PUBLISHING_IDENTITIES,
  STORY_CATEGORIES,
  STORY_FORMATS,
  STORY_INTENTS,
  STORY_UPDATE_TYPES,
  STORY_STATUSES,
  VERIFICATION_LABELS,
  VOICE_TREATMENTS
} from "../config/constants.js";
import { isMongoReady } from "../db/connect.js";
import { seedPodcasts } from "../data/seedPodcasts.js";
import { seedStories } from "../data/seedStories.js";
import {
  createHttpError,
  createStoryId,
  makeSlug,
  normalizeEmail,
  normalizeText,
  publicPodcast,
  publicStory,
  isLatestActive
} from "../utils/storyUtils.js";

let memoryStories = seedStories.map((story) => ({
  ...JSON.parse(JSON.stringify(story)),
  createdAt: story.createdAt || new Date().toISOString(),
  updatedAt: story.updatedAt || new Date().toISOString()
}));
let memoryPodcasts = seedPodcasts.map((podcast) => ({
  ...JSON.parse(JSON.stringify(podcast)),
  createdAt: podcast.createdAt || new Date().toISOString(),
  updatedAt: podcast.updatedAt || new Date().toISOString()
}));
const memoryContacts = [];
const memoryAuditLogs = [];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function toPlainStory(story) {
  return story?.toObject ? story.toObject({ virtuals: true }) : clone(story);
}

function storyDate(story) {
  return new Date(story.publishedAt || story.createdAt || 0).getTime();
}

function contentDate(item) {
  return new Date(item.publishedAt || item.createdAt || 0).getTime();
}

function createPodcastId() {
  return `UP-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function mergedPublishSafety(story, update = {}) {
  const current = story.moderation?.publishSafety || {};
  const merged = { ...current };

  Object.entries(update).forEach(([key, value]) => {
    if (key.startsWith("moderation.publishSafety.")) {
      merged[key.replace("moderation.publishSafety.", "")] = value;
    }
  });

  return merged;
}

function publishSafetyComplete(story, update = {}) {
  if (!story.faceless) {
    return true;
  }

  const safety = mergedPublishSafety(story, update);
  return [
    "identityReviewed",
    "contactHidden",
    "evidencePrivate",
    "consentReviewed"
  ].every((key) => safety[key] === true);
}

function sortStories(stories, sort = "latest") {
  const sorted = [...stories];

  if (sort === "trending") {
    return sorted.sort((a, b) => {
      const scoreA =
        (a.stats?.views || 0) * 0.2 +
        (a.stats?.helpful || 0) * 2 +
        (a.stats?.bookmarks || 0) +
        (a.stats?.shares || 0) * 1.5;
      const scoreB =
        (b.stats?.views || 0) * 0.2 +
        (b.stats?.helpful || 0) * 2 +
        (b.stats?.bookmarks || 0) +
        (b.stats?.shares || 0) * 1.5;
      return scoreB - scoreA;
    });
  }

  return sorted.sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) {
      return Number(b.pinned) - Number(a.pinned);
    }
    if (Boolean(a.featured) !== Boolean(b.featured)) {
      return Number(b.featured) - Number(a.featured);
    }
    return storyDate(b) - storyDate(a);
  });
}

function applyFilters(stories, query = {}, admin = false) {
  const q = normalizeText(query.q).toLowerCase();
  const category = normalizeText(query.category);
  const vertical = normalizeText(query.vertical);
  const status = normalizeText(query.status);
  const featured = normalizeText(query.featured);
  const limit = Math.min(Number(query.limit || 24), 80);

  let filtered = stories.filter((story) => {
    if (!admin && story.status !== "published") {
      return false;
    }
    if (!admin && query.latest === "true" && !isLatestActive(story)) {
      return false;
    }
    if (admin && status && status !== "all" && story.status !== status) {
      return false;
    }
    if (category && category !== "All" && story.category !== category) {
      return false;
    }
    if (featured && String(Boolean(story.featured)) !== featured) {
      return false;
    }
    if (vertical === "faceless" && !story.faceless) {
      return false;
    }
    if (!q) {
      return true;
    }

    const haystack = [
      story.title,
      story.body,
      story.category,
      story.intent,
      story.country,
      story.regionCity,
      story.storyId
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });

  filtered = sortStories(filtered, query.sort || (vertical === "trending" ? "trending" : "latest"));
  return filtered.slice(0, limit);
}

function mongoFilters(query = {}, admin = false) {
  const filters = {};
  const q = normalizeText(query.q);
  const category = normalizeText(query.category);
  const vertical = normalizeText(query.vertical);
  const status = normalizeText(query.status);
  const featured = normalizeText(query.featured);

  if (!admin) {
    filters.status = "published";
  } else if (status && status !== "all") {
    filters.status = status;
  }

  if (category && category !== "All") {
    filters.category = category;
  }

  if (featured) {
    filters.featured = featured === "true";
  }

  if (vertical === "faceless") {
    filters.faceless = true;
  }

  if (!admin && query.latest === "true") {
    filters.showInLatest = true;
    filters.$and = [
      {
        $or: [
          { latestExpiresAt: { $exists: false } },
          { latestExpiresAt: null },
          { latestExpiresAt: { $gt: new Date() } }
        ]
      }
    ];
  }

  if (q) {
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filters.$or = [
      { title: regex },
      { body: regex },
      { category: regex },
      { intent: regex },
      { country: regex },
      { regionCity: regex },
      { storyId: regex }
    ];
  }

  return filters;
}

async function recordAudit(action, storyId, detail = {}, actor = "system") {
  if (isMongoReady()) {
    await AuditLog.create({ action, storyId, detail, actor });
    return;
  }

  memoryAuditLogs.push({
    action,
    storyId,
    detail,
    actor,
    createdAt: new Date().toISOString()
  });
}

export async function seedIfNeeded() {
  if (!isMongoReady()) {
    return;
  }

  const count = await Story.estimatedDocumentCount();
  if (count === 0) {
    await Story.insertMany(seedStories);
    await recordAudit("seed", null, { count: seedStories.length });
  }

  const podcastCount = await Podcast.estimatedDocumentCount();
  if (podcastCount === 0) {
    await Podcast.insertMany(seedPodcasts);
    await recordAudit("podcast.seed", null, { count: seedPodcasts.length });
  }
}

export async function listPublicStories(query) {
  if (isMongoReady()) {
    const limit = Math.min(Number(query.limit || 24), 80);
    const sort =
      query.sort === "trending"
        ? { "stats.helpful": -1, "stats.views": -1 }
        : { pinned: -1, featured: -1, publishedAt: -1, createdAt: -1 };

    const stories = await Story.find(mongoFilters(query, false)).sort(sort).limit(limit);
    return stories.map((story) => publicStory(toPlainStory(story)));
  }

  return applyFilters(memoryStories, query, false).map(publicStory);
}

export async function listPublicPodcasts(query = {}) {
  const limit = Math.min(Number(query.limit || 24), 80);
  const latestOnly = query.latest === "true";

  if (isMongoReady()) {
    const filters = { status: "published" };
    if (latestOnly) {
      filters.showInLatest = true;
      filters.$or = [
        { latestExpiresAt: { $exists: false } },
        { latestExpiresAt: null },
        { latestExpiresAt: { $gt: new Date() } }
      ];
    }

    const podcasts = await Podcast.find(filters)
      .sort({ showInLatest: -1, publishedAt: -1, createdAt: -1 })
      .limit(limit);
    return podcasts.map((podcast) => publicPodcast(toPlainStory(podcast)));
  }

  return memoryPodcasts
    .filter((podcast) => podcast.status === "published")
    .filter((podcast) => !latestOnly || isLatestActive(podcast))
    .sort((a, b) => contentDate(b) - contentDate(a))
    .slice(0, limit)
    .map(publicPodcast);
}

export async function listPublicFeed(query = {}) {
  const limit = Math.min(Number(query.limit || 30), 80);
  const [stories, podcasts] = await Promise.all([
    listPublicStories({ ...query, latest: "true", limit }),
    listPublicPodcasts({ ...query, latest: "true", limit })
  ]);

  return [...stories, ...podcasts]
    .sort((a, b) => contentDate(b) - contentDate(a))
    .slice(0, limit);
}

export async function getPublicStory(slugOrId, { incrementViews = false } = {}) {
  if (isMongoReady()) {
    const story = await Story.findOne({
      $or: [{ slug: slugOrId }, { storyId: slugOrId }],
      status: "published"
    });

    if (!story) {
      throw createHttpError(404, "Story not found");
    }

    if (incrementViews) {
      story.stats.views += 1;
      await story.save();
    }

    return publicStory(toPlainStory(story));
  }

  const story = memoryStories.find(
    (item) =>
      item.status === "published" && (item.slug === slugOrId || item.storyId === slugOrId)
  );

  if (!story) {
    throw createHttpError(404, "Story not found");
  }

  if (incrementViews) {
    story.stats.views += 1;
    story.updatedAt = new Date().toISOString();
  }

  return publicStory(story);
}

export async function createStory(payload) {
  const storyId = createStoryId();
  const body = normalizeText(payload.body) || "Audio story submitted for editorial review.";
  const storyInputTypes = payload.storyInputTypes?.length
    ? payload.storyInputTypes
    : [payload.storyAudio ? "audio" : "typed"];
  const requestedFormats = [
    storyInputTypes.includes("typed") ? "written_story" : null,
    storyInputTypes.includes("audio") ? "voice_read" : null
  ].filter(Boolean);
  const submissionMode = payload.submissionMode === "account" ? "account" : "anonymous_guest";
  const story = {
    ...payload,
    body,
    storyId,
    slug: makeSlug(payload.title, storyId),
    status: "submitted",
    verificationLabel: "unverified",
    featured: false,
    pinned: false,
    showInLatest: false,
    latestExpiresAt: null,
    solved: false,
    submissionMode,
    authorUserId: submissionMode === "account" ? payload.authorUserId : "",
    authorEmail: submissionMode === "account" ? payload.authorEmail : "",
    authorPhone: submissionMode === "account" ? payload.authorPhone : "",
    storyInputTypes,
    faceless:
      payload.submissionType === "anonymous" ||
      payload.publishingPreference === "anonymous",
    requestedFormats: requestedFormats.length ? requestedFormats : ["written_story"],
    voiceTreatment: payload.voiceTreatment || "read_as_submitted",
    stats: {
      views: 0,
      helpful: 0,
      likes: 0,
      follows: 0,
      favorites: 0,
      bookmarks: 0,
      shares: 0,
      reports: 0
    },
    updates: [],
    comments: [],
    advice: [],
    moderation: {
      publishSafety: {
        identityReviewed: false,
        contactHidden: false,
        evidencePrivate: false,
        namesChanged: false,
        locationsChanged: false,
        consentReviewed: false
      },
      history: [
        {
          action: "submitted",
          actor: "system",
          note: "Story submitted"
        }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (isMongoReady()) {
    const created = await Story.create(story);
    await recordAudit("story.created", storyId, { title: story.title });
    return toPlainStory(created);
  }

  memoryStories.unshift(story);
  await recordAudit("story.created", storyId, { title: story.title });
  return clone(story);
}

export async function appendStoryUpdate(storyId, payload = {}) {
  const user = payload.user || null;
  const normalizedEmail = normalizeEmail(user?.email || payload.email);
  const update = {
    type: STORY_UPDATE_TYPES.includes(payload.type) ? payload.type : "missing_point",
    referenceLine: normalizeText(payload.referenceLine),
    suggestedWording: normalizeText(payload.suggestedWording),
    body: normalizeText(payload.body || payload.update),
    authorUserId: normalizeText(user?.sub),
    authorEmail: normalizedEmail,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!update.body) {
    throw createHttpError(400, "Update body is required");
  }
  if (!user?.sub) {
    throw createHttpError(401, "Sign in to add up to an account story");
  }

  if (isMongoReady()) {
    const story = await Story.findOne({ storyId });
    if (!story) {
      throw createHttpError(404, "Story not found");
    }
    if (story.submissionMode !== "account" || !story.authorUserId) {
      throw createHttpError(403, "Anonymous guest submissions cannot receive account add-ups");
    }
    if (story.authorUserId !== user.sub) {
      throw createHttpError(403, "Only the submitting account can add up to this story");
    }

    story.updates.push(update);
    story.moderation.history.push({
      action: "add_up.submitted",
      actor: "author",
      note: `Author submitted ${update.type.replaceAll("_", " ")}`
    });
    await story.save();
    await recordAudit("story.add_up_submitted", storyId, { type: update.type });
    return toPlainStory(story);
  }

  const story = memoryStories.find((item) => item.storyId === storyId);
  if (!story) {
    throw createHttpError(404, "Story not found");
  }
  if (story.submissionMode !== "account" || !story.authorUserId) {
    throw createHttpError(403, "Anonymous guest submissions cannot receive account add-ups");
  }
  if (story.authorUserId !== user.sub) {
    throw createHttpError(403, "Only the submitting account can add up to this story");
  }

  story.updates.push(update);
  story.updatedAt = new Date().toISOString();
  story.moderation.history.push({
    action: "add_up.submitted",
    actor: "author",
    note: `Author submitted ${update.type.replaceAll("_", " ")}`,
    createdAt: new Date().toISOString()
  });
  await recordAudit("story.add_up_submitted", storyId, { type: update.type });
  return clone(story);
}

export async function addAdvice(storyId, payload) {
  const advice = {
    name: normalizeText(payload.name) || "Community member",
    message: normalizeText(payload.message),
    helpful: 0,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!advice.message) {
    throw createHttpError(400, "Advice message is required");
  }

  if (isMongoReady()) {
    const story = await Story.findOne({ storyId, status: "published" });
    if (!story) {
      throw createHttpError(404, "Story not found");
    }
    story.advice.push(advice);
    await story.save();
    await recordAudit("story.advice_submitted", storyId, {});
    return toPlainStory(story);
  }

  const story = memoryStories.find(
    (item) => item.storyId === storyId && item.status === "published"
  );
  if (!story) {
    throw createHttpError(404, "Story not found");
  }

  story.advice.push(advice);
  story.updatedAt = new Date().toISOString();
  await recordAudit("story.advice_submitted", storyId, {});
  return clone(story);
}

export async function addComment(storyId, payload) {
  const comment = {
    name: normalizeText(payload.name) || "Reader",
    message: normalizeText(payload.message),
    helpful: 0,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!comment.message) {
    throw createHttpError(400, "Comment message is required");
  }

  if (isMongoReady()) {
    const story = await Story.findOne({ storyId, status: "published" });
    if (!story) {
      throw createHttpError(404, "Story not found");
    }
    story.comments.push(comment);
    await story.save();
    await recordAudit("story.comment_submitted", storyId, {});
    return toPlainStory(story);
  }

  const story = memoryStories.find(
    (item) => item.storyId === storyId && item.status === "published"
  );
  if (!story) {
    throw createHttpError(404, "Story not found");
  }

  story.comments = story.comments || [];
  story.comments.push(comment);
  story.updatedAt = new Date().toISOString();
  await recordAudit("story.comment_submitted", storyId, {});
  return clone(story);
}

export async function incrementStoryStat(storyId, type) {
  const map = {
    helpful: "helpful",
    like: "likes",
    likes: "likes",
    follow: "follows",
    follows: "follows",
    favorite: "favorites",
    favorites: "favorites",
    bookmark: "bookmarks",
    bookmarks: "bookmarks",
    share: "shares",
    shares: "shares",
    report: "reports",
    reports: "reports"
  };
  const stat = map[type];

  if (!stat) {
    throw createHttpError(400, "Unsupported reaction type");
  }

  if (isMongoReady()) {
    const story = await Story.findOneAndUpdate(
      { storyId, status: "published" },
      { $inc: { [`stats.${stat}`]: 1 } },
      { new: true }
    );

    if (!story) {
      throw createHttpError(404, "Story not found");
    }

    await recordAudit(`story.${stat}`, storyId, {});
    return publicStory(toPlainStory(story));
  }

  const story = memoryStories.find(
    (item) => item.storyId === storyId && item.status === "published"
  );
  if (!story) {
    throw createHttpError(404, "Story not found");
  }
  story.stats[stat] += 1;
  story.updatedAt = new Date().toISOString();
  await recordAudit(`story.${stat}`, storyId, {});
  return publicStory(story);
}

export async function getPublicPodcast(slugOrId, { incrementListens = false } = {}) {
  if (isMongoReady()) {
    const podcast = await Podcast.findOne({
      $or: [{ slug: slugOrId }, { podcastId: slugOrId }],
      status: "published"
    });

    if (!podcast) {
      throw createHttpError(404, "Podcast not found");
    }

    if (incrementListens) {
      podcast.stats.listens += 1;
      await podcast.save();
    }

    return publicPodcast(toPlainStory(podcast));
  }

  const podcast = memoryPodcasts.find(
    (item) => item.status === "published" && (item.slug === slugOrId || item.podcastId === slugOrId)
  );

  if (!podcast) {
    throw createHttpError(404, "Podcast not found");
  }

  if (incrementListens) {
    podcast.stats.listens += 1;
    podcast.updatedAt = new Date().toISOString();
  }

  return publicPodcast(podcast);
}

export async function incrementPodcastStat(podcastId, type) {
  const map = {
    like: "likes",
    likes: "likes",
    favorite: "favorites",
    favorites: "favorites",
    share: "shares",
    shares: "shares"
  };
  const stat = map[type];

  if (!stat) {
    throw createHttpError(400, "Unsupported podcast reaction type");
  }

  if (isMongoReady()) {
    const podcast = await Podcast.findOneAndUpdate(
      { podcastId, status: "published" },
      { $inc: { [`stats.${stat}`]: 1 } },
      { new: true }
    );

    if (!podcast) {
      throw createHttpError(404, "Podcast not found");
    }

    await recordAudit(`podcast.${stat}`, podcastId, {});
    return publicPodcast(toPlainStory(podcast));
  }

  const podcast = memoryPodcasts.find(
    (item) => item.podcastId === podcastId && item.status === "published"
  );
  if (!podcast) {
    throw createHttpError(404, "Podcast not found");
  }
  podcast.stats[stat] += 1;
  podcast.updatedAt = new Date().toISOString();
  await recordAudit(`podcast.${stat}`, podcastId, {});
  return publicPodcast(podcast);
}

export async function addPodcastComment(podcastId, payload) {
  const comment = {
    name: normalizeText(payload.name) || "Listener",
    message: normalizeText(payload.message),
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!comment.message) {
    throw createHttpError(400, "Comment message is required");
  }

  if (isMongoReady()) {
    const podcast = await Podcast.findOne({ podcastId, status: "published" });
    if (!podcast) {
      throw createHttpError(404, "Podcast not found");
    }
    podcast.comments.push(comment);
    await podcast.save();
    await recordAudit("podcast.comment_submitted", podcastId, {});
    return publicPodcast(toPlainStory(podcast));
  }

  const podcast = memoryPodcasts.find(
    (item) => item.podcastId === podcastId && item.status === "published"
  );
  if (!podcast) {
    throw createHttpError(404, "Podcast not found");
  }
  podcast.comments.push(comment);
  podcast.updatedAt = new Date().toISOString();
  await recordAudit("podcast.comment_submitted", podcastId, {});
  return publicPodcast(podcast);
}

export async function createContactMessage(payload) {
  const message = {
    name: normalizeText(payload.name),
    email: normalizeEmail(payload.email),
    topic: normalizeText(payload.topic) || "general",
    message: normalizeText(payload.message),
    status: "new",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!message.message) {
    throw createHttpError(400, "Message is required");
  }

  if (isMongoReady()) {
    return ContactMessage.create(message);
  }

  memoryContacts.unshift(message);
  return clone(message);
}

export async function listAdminStories(query) {
  if (isMongoReady()) {
    const limit = Math.min(Number(query.limit || 80), 120);
    const stories = await Story.find(mongoFilters(query, true))
      .sort({ createdAt: -1 })
      .limit(limit);
    return stories.map(toPlainStory);
  }

  return applyFilters(memoryStories, { ...query, limit: query.limit || 80 }, true);
}

export async function listAdminPodcasts(query = {}) {
  const status = normalizeText(query.status);
  const limit = Math.min(Number(query.limit || 80), 120);

  if (isMongoReady()) {
    const filters = status && status !== "all" ? { status } : {};
    const podcasts = await Podcast.find(filters)
      .sort({ createdAt: -1 })
      .limit(limit);
    return podcasts.map(toPlainStory);
  }

  return memoryPodcasts
    .filter((podcast) => !status || status === "all" || podcast.status === status)
    .sort((a, b) => contentDate(b) - contentDate(a))
    .slice(0, limit)
    .map(clone);
}

export async function createAdminPodcast(payload, file, actor = "admin") {
  const podcastId = createPodcastId();
  const title = normalizeText(payload.title);
  const description = normalizeText(payload.description);

  if (!title || !description) {
    throw createHttpError(400, "Podcast title and description are required");
  }

  const podcast = {
    podcastId,
    slug: makeSlug(title, podcastId),
    title,
    description,
    audioUrl: file ? `/uploads/${file.filename}` : normalizeText(payload.audioUrl),
    coverImageUrl: normalizeText(payload.coverImageUrl),
    linkedStoryId: normalizeText(payload.linkedStoryId),
    uncoveredNote: normalizeText(payload.uncoveredNote),
    status: CONTENT_STATUSES.includes(payload.status) ? payload.status : "draft",
    showInLatest: payload.showInLatest === true || payload.showInLatest === "true",
    latestExpiresAt: payload.latestExpiresAt ? new Date(payload.latestExpiresAt) : null,
    publishedAt: payload.status === "published" ? new Date() : null,
    stats: {
      listens: 0,
      likes: 0,
      favorites: 0,
      shares: 0
    },
    comments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (isMongoReady()) {
    const created = await Podcast.create(podcast);
    await recordAudit("podcast.created", podcastId, { title }, actor);
    return toPlainStory(created);
  }

  memoryPodcasts.unshift(podcast);
  await recordAudit("podcast.created", podcastId, { title }, actor);
  return clone(podcast);
}

export async function updateAdminPodcast(podcastId, payload, actor = "admin") {
  const update = {};

  ["title", "description", "audioUrl", "coverImageUrl", "linkedStoryId", "uncoveredNote"].forEach(
    (key) => {
      if (payload[key] !== undefined) {
        update[key] = normalizeText(payload[key]);
      }
    }
  );
  if (payload.status && CONTENT_STATUSES.includes(payload.status)) {
    update.status = payload.status;
  }
  if (typeof payload.showInLatest === "boolean") {
    update.showInLatest = payload.showInLatest;
  }
  if (payload.latestExpiresAt !== undefined) {
    update.latestExpiresAt = payload.latestExpiresAt ? new Date(payload.latestExpiresAt) : null;
  }
  if (update.status === "published") {
    update.publishedAt = new Date();
  }

  if (isMongoReady()) {
    const podcast = await Podcast.findOne({ podcastId });
    if (!podcast) {
      throw createHttpError(404, "Podcast not found");
    }
    Object.entries(update).forEach(([key, value]) => podcast.set(key, value));
    await podcast.save();
    await recordAudit("podcast.admin_updated", podcastId, update, actor);
    return toPlainStory(podcast);
  }

  const podcast = memoryPodcasts.find((item) => item.podcastId === podcastId);
  if (!podcast) {
    throw createHttpError(404, "Podcast not found");
  }
  Object.entries(update).forEach(([key, value]) => {
    podcast[key] = value instanceof Date ? value.toISOString() : value;
  });
  podcast.updatedAt = new Date().toISOString();
  await recordAudit("podcast.admin_updated", podcastId, update, actor);
  return clone(podcast);
}

export async function getAdminStory(storyId) {
  if (isMongoReady()) {
    const story = await Story.findOne({ storyId });
    if (!story) {
      throw createHttpError(404, "Story not found");
    }
    return toPlainStory(story);
  }

  const story = memoryStories.find((item) => item.storyId === storyId);
  if (!story) {
    throw createHttpError(404, "Story not found");
  }
  return clone(story);
}

export async function updateAdminStory(storyId, payload, actor = "admin") {
  const update = {};

  if (payload.status && STORY_STATUSES.includes(payload.status)) {
    update.status = payload.status;
  }
  if (payload.verificationLabel && VERIFICATION_LABELS.includes(payload.verificationLabel)) {
    update.verificationLabel = payload.verificationLabel;
  }
  ["featured", "pinned", "solved"].forEach((key) => {
    if (typeof payload[key] === "boolean") {
      update[key] = payload[key];
    }
  });
  if (typeof payload.showInLatest === "boolean") {
    update.showInLatest = payload.showInLatest;
  }
  if (payload.latestExpiresAt !== undefined) {
    update.latestExpiresAt = payload.latestExpiresAt ? new Date(payload.latestExpiresAt) : null;
  }
  if (payload.publishingPreference && PUBLISHING_IDENTITIES.includes(payload.publishingPreference)) {
    update.publishingPreference = payload.publishingPreference;
  }
  if (payload.requestedFormats) {
    const formats = Array.isArray(payload.requestedFormats)
      ? payload.requestedFormats
      : [payload.requestedFormats];
    update.requestedFormats = formats.filter((item) => STORY_FORMATS.includes(item));
  }
  if (payload.voiceTreatment && VOICE_TREATMENTS.includes(payload.voiceTreatment)) {
    update.voiceTreatment = payload.voiceTreatment;
  }
  if (payload.displayName !== undefined) {
    update.displayName = normalizeText(payload.displayName);
  }
  if (payload.accountUsername !== undefined) {
    update.accountUsername = normalizeText(payload.accountUsername);
  }
  if (payload.characterName !== undefined) {
    update.characterName = normalizeText(payload.characterName);
  }
  if (payload.changeDetails !== undefined) {
    update.changeDetails = normalizeText(payload.changeDetails);
  }
  if (payload.publishSafety && typeof payload.publishSafety === "object") {
    [
      "identityReviewed",
      "contactHidden",
      "evidencePrivate",
      "namesChanged",
      "locationsChanged",
      "consentReviewed"
    ].forEach((key) => {
      if (typeof payload.publishSafety[key] === "boolean") {
        update[`moderation.publishSafety.${key}`] = payload.publishSafety[key];
      }
    });
  }
  if (payload.assignedTo !== undefined) {
    update["moderation.assignedTo"] = normalizeText(payload.assignedTo);
  }
  if (payload.moderationNote !== undefined) {
    update["moderation.notes"] = normalizeText(payload.moderationNote);
  }
  if (payload.title) {
    update.title = normalizeText(payload.title);
  }
  if (payload.body) {
    update.body = normalizeText(payload.body);
  }
  if (update.status === "published") {
    update.publishedAt = new Date();
  }

  if (isMongoReady()) {
    const story = await Story.findOne({ storyId });
    if (!story) {
      throw createHttpError(404, "Story not found");
    }

    if (update.status === "published" && !publishSafetyComplete(toPlainStory(story), update)) {
      throw createHttpError(
        400,
        "Complete the Faceless Voices publish safety checklist before publishing"
      );
    }

    Object.entries(update).forEach(([key, value]) => {
      story.set(key, value);
    });
    story.moderation.history.push({
      action: "admin.updated",
      actor,
      note: payload.moderationNote || `Updated ${Object.keys(update).join(", ")}`
    });
    await story.save();
    await recordAudit("story.admin_updated", storyId, update, actor);
    return toPlainStory(story);
  }

  const story = memoryStories.find((item) => item.storyId === storyId);
  if (!story) {
    throw createHttpError(404, "Story not found");
  }

  if (update.status === "published" && !publishSafetyComplete(story, update)) {
    throw createHttpError(
      400,
      "Complete the Faceless Voices publish safety checklist before publishing"
    );
  }

  Object.entries(update).forEach(([key, value]) => {
    if (key.includes(".")) {
      const [first, second] = key.split(".");
      story[first] = story[first] || {};
      story[first][second] = value;
    } else {
      story[key] = value instanceof Date ? value.toISOString() : value;
    }
  });
  story.updatedAt = new Date().toISOString();
  story.moderation.history.push({
    action: "admin.updated",
    actor,
    note: payload.moderationNote || `Updated ${Object.keys(update).join(", ")}`,
    createdAt: new Date().toISOString()
  });
  await recordAudit("story.admin_updated", storyId, update, actor);
  return clone(story);
}

export async function requestMoreInfo(storyId, note, actor = "admin") {
  return updateAdminStory(
    storyId,
    {
      status: "request_info",
      moderationNote: normalizeText(note) || "More information requested"
    },
    actor
  );
}

export async function updateAdviceStatus(storyId, adviceId, status, actor = "admin") {
  if (!["pending", "approved", "rejected"].includes(status)) {
    throw createHttpError(400, "Unsupported advice status");
  }

  if (isMongoReady()) {
    const story = await Story.findOne({ storyId });
    if (!story) {
      throw createHttpError(404, "Story not found");
    }
    const advice = story.advice.id(adviceId);
    if (!advice) {
      throw createHttpError(404, "Advice not found");
    }
    advice.status = status;
    story.moderation.history.push({
      action: "advice.moderated",
      actor,
      note: `Advice ${status}`
    });
    await story.save();
    await recordAudit("story.advice_moderated", storyId, { adviceId, status }, actor);
    return toPlainStory(story);
  }

  const story = memoryStories.find((item) => item.storyId === storyId);
  if (!story) {
    throw createHttpError(404, "Story not found");
  }
  const advice = story.advice.find((item) => item._id === adviceId || item.id === adviceId);
  if (!advice) {
    throw createHttpError(404, "Advice not found");
  }
  advice.status = status;
  story.updatedAt = new Date().toISOString();
  await recordAudit("story.advice_moderated", storyId, { adviceId, status }, actor);
  return clone(story);
}

export async function getAdminStats() {
  const stories = isMongoReady()
    ? await Story.find({}).lean()
    : memoryStories.map((story) => clone(story));
  const podcasts = isMongoReady()
    ? await Podcast.find({}).lean()
    : memoryPodcasts.map((podcast) => clone(podcast));

  const byStatus = Object.fromEntries(STORY_STATUSES.map((status) => [status, 0]));
  const byCategory = Object.fromEntries(STORY_CATEGORIES.map((category) => [category, 0]));
  let evidenceCount = 0;

  stories.forEach((story) => {
    byStatus[story.status] = (byStatus[story.status] || 0) + 1;
    byCategory[story.category] = (byCategory[story.category] || 0) + 1;
    evidenceCount += story.evidence?.length || 0;
  });

  return {
    totalStories: stories.length,
    totalPodcasts: podcasts.length,
    publishedStories: byStatus.published || 0,
    publishedPodcasts: podcasts.filter((podcast) => podcast.status === "published").length,
    queueStories:
      (byStatus.submitted || 0) + (byStatus.in_review || 0) + (byStatus.request_info || 0),
    evidenceCount,
    reports: stories.reduce((sum, story) => sum + (story.stats?.reports || 0), 0),
    pendingComments:
      stories.reduce(
        (sum, story) =>
          sum + (story.comments || []).filter((comment) => comment.status === "pending").length,
        0
      ) +
      podcasts.reduce(
        (sum, podcast) =>
          sum + (podcast.comments || []).filter((comment) => comment.status === "pending").length,
        0
      ),
    byStatus,
    byCategory,
    contacts: isMongoReady() ? await ContactMessage.countDocuments({}) : memoryContacts.length,
    auditEvents: isMongoReady() ? await AuditLog.countDocuments({}) : memoryAuditLogs.length
  };
}

export function validateStoryInput(payload) {
  const errors = [];
  const hasTypedStory = normalizeText(payload.body).length >= 40;
  const hasStoryAudio = Boolean(payload.storyAudio?.filename || payload.storyAudio?.path);

  if (!normalizeText(payload.title)) {
    errors.push("Title is required");
  }
  if (!STORY_CATEGORIES.includes(payload.category)) {
    errors.push("Choose a valid category");
  }
  if (!STORY_INTENTS.includes(payload.intent)) {
    errors.push("Choose a valid intent");
  }
  if (!PUBLISHING_IDENTITIES.includes(payload.publishingPreference)) {
    errors.push("Choose a valid publishing identity");
  }
  if (payload.voiceTreatment && !VOICE_TREATMENTS.includes(payload.voiceTreatment)) {
    errors.push("Choose a valid voice treatment");
  }
  if (!hasTypedStory && !hasStoryAudio) {
    errors.push("Add a typed story of at least 40 characters or record/upload audio");
  }
  if (!normalizeText(payload.country)) {
    errors.push("Country is required");
  }
  if (payload.submissionMode === "account" && !payload.authorUserId) {
    errors.push("Sign in before submitting from an account");
  }
  if (payload.submissionMode === "account" && !normalizeEmail(payload.contact?.email)) {
    errors.push("Account email is required for account submissions");
  }
  if (!payload.consents?.terms || !payload.consents?.publish) {
    errors.push("Required consent checkboxes must be accepted");
  }

  return errors;
}
