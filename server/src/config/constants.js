export const STORY_CATEGORIES = [
  "Need Help ASAP",
  "Need Advice",
  "Warning/Caution",
  "Scam/Fraud",
  "Crime",
  "Corruption",
  "Life Story",
  "Life Lesson",
  "Relationship",
  "Family",
  "Health",
  "Mental Health",
  "Workplace",
  "Education",
  "Missing Person",
  "Tribute",
  "Success Story",
  "Other"
];

export const STORY_INTENTS = [
  "Need Help ASAP",
  "Need Advice",
  "Warn others",
  "Share what happened",
  "Add my voice",
  "Share experience",
  "Honor someone",
  "Share a resolution"
];

export const SENSITIVE_FLAGS = [
  "Violence",
  "Abuse",
  "Self-harm",
  "Sexual content",
  "Medical details",
  "Legal matter",
  "Identifies a private person"
];

export const STORY_STATUSES = [
  "submitted",
  "in_review",
  "request_info",
  "approved",
  "rejected",
  "published",
  "archived"
];

export const VERIFICATION_LABELS = [
  "unverified",
  "in_review",
  "source_contacted",
  "document_supported",
  "verified"
];

export const PUBLISHING_IDENTITIES = [
  "anonymous",
  "username",
  "first_name",
  "surname"
];

export const STORY_FORMATS = [
  "written_story",
  "voice_read",
  "podcast_episode",
  "blog_article"
];

export const VOICE_TREATMENTS = [
  "read_as_submitted",
  "use_my_character",
  "change_characters",
  "change_locations",
  "change_characters_and_locations"
];

export const STORY_UPDATE_TYPES = [
  "missing_point",
  "clarification",
  "line_reference",
  "wording_change",
  "new_development"
];

export const CONTENT_STATUSES = [
  "draft",
  "scheduled",
  "published",
  "archived"
];

export const TRUST_POLICIES = [
  {
    id: "faceless-voices",
    title: "Faceless Voices protection",
    body:
      "Anonymous submissions are reviewed with public identity, private contact, and evidence separated. Public versions may change names, characters, or locations when needed for safety."
  },
  {
    id: "original-preserved",
    title: "Original story preserved",
    body:
      "Submitters cannot edit the original story after submission. They can add missing points, clarifications, reference a line, or submit wording notes as moderated add-ups."
  },
  {
    id: "not-emergency",
    title: "Not emergency services",
    body:
      "UNCOVERED can publish stories and connect context, but urgent danger, crime in progress, or medical crisis should go to local emergency services first."
  },
  {
    id: "verification-labels",
    title: "Verification labels",
    body:
      "Labels such as unverified, source contacted, document supported, and verified explain what the editorial team has reviewed before publishing."
  }
];

export const VERIFICATION_EXPLAINERS = {
  unverified: "Published as a personal account without independent confirmation.",
  in_review: "The editorial team is reviewing context, safety, or documents.",
  source_contacted: "The submitter or source has been contacted for follow-up.",
  document_supported: "Documents or evidence support key parts of the account.",
  verified: "The editorial team has verified key details available to them."
};

export const USER_ROLES = [
  "guest",
  "registered_user",
  "moderator",
  "editor",
  "administrator",
  "super_admin"
];
