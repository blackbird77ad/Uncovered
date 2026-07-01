const toneByStatus = {
  submitted: "neutral",
  in_review: "info",
  request_info: "warning",
  approved: "success",
  rejected: "danger",
  published: "success",
  archived: "neutral",
  unverified: "neutral",
  source_contacted: "info",
  document_supported: "info",
  verified: "success"
};

export default function StatusBadge({ value }) {
  if (!value) {
    return null;
  }

  const tone = toneByStatus[value] || "neutral";
  const label = value.replaceAll("_", " ");

  return <span className={`status-badge status-badge--${tone}`}>{label}</span>;
}
