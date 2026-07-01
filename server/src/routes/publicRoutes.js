import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  PUBLISHING_IDENTITIES,
  SENSITIVE_FLAGS,
  STORY_CATEGORIES,
  STORY_INTENTS,
  STORY_UPDATE_TYPES,
  TRUST_POLICIES,
  USER_ROLES,
  VERIFICATION_EXPLAINERS
} from "../config/constants.js";
import { createUserSession, optionalUser, requireUser } from "../middleware/userAuth.js";
import { evidenceUpload } from "../middleware/upload.js";
import {
  addComment,
  addPodcastComment,
  addAdvice,
  appendStoryUpdate,
  createContactMessage,
  createStory,
  getPublicPodcast,
  getPublicStory,
  incrementPodcastStat,
  incrementStoryStat,
  listPublicFeed,
  listPublicPodcasts,
  listPublicStories,
  validateStoryInput
} from "../repositories/storyRepository.js";
import {
  authenticateUser,
  createUserAccount,
  getUserById
} from "../repositories/userRepository.js";
import {
  sendAdminNotification,
  sendContactNotification,
  sendSubmissionReceipt
} from "../services/emailService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createHttpError,
  normalizeEmail,
  normalizeText,
  parseArray,
  parseBoolean,
  publicStory
} from "../utils/storyUtils.js";

export const publicRoutes = Router();

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 12,
  standardHeaders: true,
  legacyHeaders: false
});

function fieldArray(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeText);
  }

  if (value === undefined) {
    return [];
  }

  return [normalizeText(value)];
}

function filePayload(file) {
  if (!file) {
    return null;
  }

  return {
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
    uploadedAt: new Date().toISOString()
  };
}

function buildStoryPayload(body, files = {}, user = null) {
  const evidenceFiles = files.evidence || [];
  const storyAudio = filePayload((files.storyAudio || [])[0]);
  const evidenceDescriptions = fieldArray(body.evidenceDescriptions);
  const evidenceSupportsLine = fieldArray(body.evidenceSupportsLine);
  const wantsAccountSubmission = normalizeText(body.submissionMode) === "account";
  const submissionMode = wantsAccountSubmission && user ? "account" : "anonymous_guest";
  const storyText = normalizeText(body.story || body.body);
  const storyInputTypes = [
    storyText ? "typed" : null,
    storyAudio ? "audio" : null
  ].filter(Boolean);

  return {
    title: normalizeText(body.title),
    category: normalizeText(body.category),
    intent: normalizeText(body.intent),
    body: storyText,
    country: normalizeText(body.country),
    regionCity: normalizeText(body.regionCity),
    happenedAt: normalizeText(body.happenedAt),
    urgency: normalizeText(body.urgency) || "normal",
    submissionType: normalizeText(body.submissionType) || "anonymous",
    publishingPreference: normalizeText(body.publishingPreference) || "anonymous",
    submissionMode,
    authorUserId: submissionMode === "account" ? user.sub : "",
    authorEmail: submissionMode === "account" ? normalizeEmail(user.email) : "",
    authorPhone: submissionMode === "account" ? normalizeText(user.phone) : "",
    accountUsername:
      submissionMode === "account" ? normalizeText(body.accountUsername || user.username) : "",
    displayName: normalizeText(
      body.displayName ||
        (submissionMode === "account" ? user.displayName || user.username : "") ||
        body.contactName ||
        "Anonymous"
    ),
    storyInputTypes,
    storyAudio,
    voiceTreatment: "read_as_submitted",
    sensitiveFlags: parseArray(body.sensitiveFlags),
    contact: {
      name:
        submissionMode === "account"
          ? normalizeText(body.contactName || user.displayName)
          : normalizeText(body.contactName),
      email:
        submissionMode === "account"
          ? normalizeEmail(user.email)
          : normalizeEmail(body.email),
      phone:
        submissionMode === "account"
          ? normalizeText(user.phone)
          : normalizeText(body.phone),
      whatsapp: normalizeText(body.whatsapp),
      preferredMethod: normalizeText(body.preferredContact) || "email"
    },
    consents: {
      terms: parseBoolean(body.consentTerms),
      publish: parseBoolean(body.consentPublish),
      contact: parseBoolean(body.consentContact),
      sensitive: parseBoolean(body.consentSensitive)
    },
    evidence: evidenceFiles.map((file, index) => ({
      ...filePayload(file),
      description: evidenceDescriptions[index] || "",
      supportsLine: evidenceSupportsLine[index] || ""
    }))
  };
}

publicRoutes.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "uncovered-api",
    timestamp: new Date().toISOString()
  });
});

publicRoutes.get("/config", (_req, res) => {
  res.json({
    categories: STORY_CATEGORIES,
    intents: STORY_INTENTS,
    sensitiveFlags: SENSITIVE_FLAGS,
    roles: USER_ROLES,
    publishingIdentities: PUBLISHING_IDENTITIES,
    storyInputTypes: ["typed", "audio"],
    storyUpdateTypes: STORY_UPDATE_TYPES,
    trustPolicies: TRUST_POLICIES,
    verificationExplainers: VERIFICATION_EXPLAINERS
  });
});

publicRoutes.post(
  "/auth/signup",
  submitLimiter,
  asyncHandler(async (req, res) => {
    const user = await createUserAccount(req.body);
    const token = createUserSession(user);
    res.status(201).json({ user, token });
  })
);

publicRoutes.post(
  "/auth/login",
  submitLimiter,
  asyncHandler(async (req, res) => {
    const user = await authenticateUser(req.body);
    const token = createUserSession(user);
    res.json({ user, token });
  })
);

publicRoutes.get(
  "/auth/me",
  requireUser,
  asyncHandler(async (req, res) => {
    const user = await getUserById(req.user.sub);
    if (!user) {
      throw createHttpError(404, "Account not found");
    }
    res.json({ user });
  })
);

publicRoutes.get(
  "/feed",
  asyncHandler(async (req, res) => {
    const feed = await listPublicFeed(req.query);
    res.json({ feed });
  })
);

publicRoutes.get(
  "/stories",
  asyncHandler(async (req, res) => {
    const stories = await listPublicStories(req.query);
    res.json({ stories });
  })
);

publicRoutes.get(
  "/stories/:slugOrId",
  asyncHandler(async (req, res) => {
    const story = await getPublicStory(req.params.slugOrId, { incrementViews: true });
    res.json({ story });
  })
);

publicRoutes.get(
  "/podcasts",
  asyncHandler(async (req, res) => {
    const podcasts = await listPublicPodcasts(req.query);
    res.json({ podcasts });
  })
);

publicRoutes.get(
  "/podcasts/:slugOrId",
  asyncHandler(async (req, res) => {
    const podcast = await getPublicPodcast(req.params.slugOrId, {
      incrementListens: true
    });
    res.json({ podcast });
  })
);

publicRoutes.post(
  "/stories",
  submitLimiter,
  optionalUser,
  evidenceUpload.fields([
    { name: "evidence", maxCount: 6 },
    { name: "storyAudio", maxCount: 1 }
  ]),
  asyncHandler(async (req, res) => {
    if (normalizeText(req.body.submissionMode) === "account" && !req.user) {
      throw createHttpError(401, "Sign in before submitting from an account");
    }

    const payload = buildStoryPayload(req.body, req.files || {}, req.user);
    const errors = validateStoryInput(payload);

    if (errors.length) {
      throw createHttpError(400, errors.join(". "));
    }

    const story = await createStory(payload);
    await Promise.allSettled([
      sendSubmissionReceipt(story),
      sendAdminNotification(story)
    ]);

    res.status(201).json({
      story: publicStory(story),
      message: "Story submitted for moderation"
    });
  })
);

publicRoutes.post(
  "/stories/:storyId/updates",
  submitLimiter,
  optionalUser,
  asyncHandler(async (req, res) => {
    const story = await appendStoryUpdate(
      req.params.storyId,
      { ...req.body, user: req.user }
    );
    res.status(201).json({
      story: publicStory(story),
      message: "Update received for moderation"
    });
  })
);

publicRoutes.post(
  "/stories/:storyId/comments",
  submitLimiter,
  asyncHandler(async (req, res) => {
    const story = await addComment(req.params.storyId, req.body);
    res.status(201).json({
      story: publicStory(story),
      message: "Comment received for moderation"
    });
  })
);

publicRoutes.post(
  "/stories/:storyId/advice",
  submitLimiter,
  asyncHandler(async (req, res) => {
    const story = await addAdvice(req.params.storyId, req.body);
    res.status(201).json({
      story: publicStory(story),
      message: "Advice received for moderation"
    });
  })
);

publicRoutes.post(
  "/podcasts/:podcastId/comments",
  submitLimiter,
  asyncHandler(async (req, res) => {
    const podcast = await addPodcastComment(req.params.podcastId, req.body);
    res.status(201).json({
      podcast,
      message: "Comment received for moderation"
    });
  })
);

publicRoutes.post(
  "/podcasts/:podcastId/reactions",
  asyncHandler(async (req, res) => {
    const podcast = await incrementPodcastStat(req.params.podcastId, req.body.type);
    res.json({ podcast });
  })
);

publicRoutes.post(
  "/stories/:storyId/reactions",
  asyncHandler(async (req, res) => {
    const story = await incrementStoryStat(req.params.storyId, req.body.type);
    res.json({ story });
  })
);

publicRoutes.post(
  "/contact",
  submitLimiter,
  asyncHandler(async (req, res) => {
    const message = await createContactMessage(req.body);
    await sendContactNotification(message);
    res.status(201).json({
      message: "Message received",
      contact: {
        topic: message.topic,
        status: message.status
      }
    });
  })
);
