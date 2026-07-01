import { Router } from "express";
import {
  CONTENT_STATUSES,
  PUBLISHING_IDENTITIES,
  STORY_FORMATS,
  STORY_STATUSES,
  VERIFICATION_LABELS,
  VOICE_TREATMENTS
} from "../config/constants.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import { createAdminSession } from "../middleware/adminAuth.js";
import { env } from "../config/env.js";
import { evidenceUpload } from "../middleware/upload.js";
import {
  createAdminPodcast,
  getAdminStats,
  getAdminStory,
  listAdminPodcasts,
  listAdminStories,
  requestMoreInfo,
  updateAdminPodcast,
  updateAdminStory,
  updateAdviceStatus
} from "../repositories/storyRepository.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const adminRoutes = Router();

adminRoutes.post("/login", (req, res) => {
  if (!env.adminUsername || !env.adminPassword) {
    return res.status(503).json({ message: "Admin credentials are not configured" });
  }

  if (req.body.username !== env.adminUsername || req.body.password !== env.adminPassword) {
    return res.status(401).json({ message: "Invalid admin credentials" });
  }

  const token = createAdminSession(req.body.username);
  return res.json({ token });
});

adminRoutes.use(requireAdmin);

adminRoutes.get("/meta", (_req, res) => {
  res.json({
    statuses: STORY_STATUSES,
    verificationLabels: VERIFICATION_LABELS,
    contentStatuses: CONTENT_STATUSES,
    publishingIdentities: PUBLISHING_IDENTITIES,
    storyFormats: STORY_FORMATS,
    voiceTreatments: VOICE_TREATMENTS
  });
});

adminRoutes.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const stats = await getAdminStats();
    res.json({ stats });
  })
);

adminRoutes.get(
  "/stories",
  asyncHandler(async (req, res) => {
    const stories = await listAdminStories(req.query);
    res.json({ stories });
  })
);

adminRoutes.get(
  "/podcasts",
  asyncHandler(async (req, res) => {
    const podcasts = await listAdminPodcasts(req.query);
    res.json({ podcasts });
  })
);

adminRoutes.post(
  "/podcasts",
  evidenceUpload.single("audio"),
  asyncHandler(async (req, res) => {
    const podcast = await createAdminPodcast(req.body, req.file, "admin");
    res.status(201).json({ podcast });
  })
);

adminRoutes.patch(
  "/podcasts/:podcastId",
  asyncHandler(async (req, res) => {
    const podcast = await updateAdminPodcast(req.params.podcastId, req.body, "admin");
    res.json({ podcast });
  })
);

adminRoutes.get(
  "/stories/:storyId",
  asyncHandler(async (req, res) => {
    const story = await getAdminStory(req.params.storyId);
    res.json({ story });
  })
);

adminRoutes.patch(
  "/stories/:storyId",
  asyncHandler(async (req, res) => {
    const story = await updateAdminStory(req.params.storyId, req.body, "admin");
    res.json({ story });
  })
);

adminRoutes.post(
  "/stories/:storyId/request-info",
  asyncHandler(async (req, res) => {
    const story = await requestMoreInfo(req.params.storyId, req.body.note, "admin");
    res.json({ story });
  })
);

adminRoutes.patch(
  "/stories/:storyId/advice/:adviceId",
  asyncHandler(async (req, res) => {
    const story = await updateAdviceStatus(
      req.params.storyId,
      req.params.adviceId,
      req.body.status,
      "admin"
    );
    res.json({ story });
  })
);
