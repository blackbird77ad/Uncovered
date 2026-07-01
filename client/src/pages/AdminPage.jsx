import {
  BarChart3,
  CheckCircle2,
  Clock,
  Headphones,
  Eye,
  FileText,
  LockKeyhole,
  MessageCircle,
  Pin,
  RefreshCcw,
  Search,
  ShieldCheck,
  Star,
  Upload,
  Volume2,
  XCircle
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  adminLogin,
  createAdminPodcast,
  getAdminMeta,
  getAdminPodcasts,
  getAdminStats,
  getAdminStories,
  getErrorMessage,
  requestStoryInfo,
  updateAdminPodcast,
  updateAdminStory
} from "../api/client.js";
import StatusBadge from "../components/StatusBadge.jsx";

const defaultStatuses = [
  "submitted",
  "in_review",
  "request_info",
  "approved",
  "rejected",
  "published",
  "archived"
];

const defaultLabels = [
  "unverified",
  "in_review",
  "source_contacted",
  "document_supported",
  "verified"
];

export default function AdminPage() {
  const [token, setToken] = useState(() => localStorage.getItem("uncovered-admin-token") || "");
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [meta, setMeta] = useState({ statuses: defaultStatuses, verificationLabels: defaultLabels });
  const [stats, setStats] = useState(null);
  const [stories, setStories] = useState([]);
  const [podcasts, setPodcasts] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedPodcastId, setSelectedPodcastId] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [q, setQ] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedStory = useMemo(
    () => stories.find((story) => story.storyId === selectedId) || stories[0],
    [selectedId, stories]
  );
  const selectedPodcast = useMemo(
    () =>
      podcasts.find((podcast) => podcast.podcastId === selectedPodcastId) || podcasts[0],
    [selectedPodcastId, podcasts]
  );

  async function loadAdmin(currentToken = token) {
    if (!currentToken) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [metaData, statData, storyData, podcastData] = await Promise.all([
        getAdminMeta(currentToken),
        getAdminStats(currentToken),
        getAdminStories(currentToken, {
          status: statusFilter,
          q,
          limit: 80
        }),
        getAdminPodcasts(currentToken, { status: "all", limit: 40 })
      ]);
      setMeta(metaData);
      setStats(statData);
      setStories(storyData);
      setPodcasts(podcastData);
      setSelectedId((current) => current || storyData[0]?.storyId || "");
      setSelectedPodcastId((current) => current || podcastData[0]?.podcastId || "");
    } catch (err) {
      if (err?.response?.status === 401) {
        localStorage.removeItem("uncovered-admin-token");
        setToken("");
      }
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdmin();
  }, [statusFilter]);

  function handleLogin(event) {
    event.preventDefault();
    adminLogin(credentials)
      .then((sessionToken) => {
        localStorage.setItem("uncovered-admin-token", sessionToken);
        setError("");
        setToken(sessionToken);
        loadAdmin(sessionToken);
      })
      .catch((err) => setError(getErrorMessage(err)));
  }

  function replaceStory(updated) {
    setStories((items) =>
      items.map((story) => (story.storyId === updated.storyId ? updated : story))
    );
    setSelectedId(updated.storyId);
  }

  function replacePodcast(updated) {
    setPodcasts((items) =>
      items.some((podcast) => podcast.podcastId === updated.podcastId)
        ? items.map((podcast) =>
            podcast.podcastId === updated.podcastId ? updated : podcast
          )
        : [updated, ...items]
    );
    setSelectedPodcastId(updated.podcastId);
  }

  async function patchStory(payload) {
    if (!selectedStory) {
      return;
    }

    try {
      const updated = await updateAdminStory(token, selectedStory.storyId, payload);
      replaceStory(updated);
      setNote("");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function patchPodcast(payload) {
    if (!selectedPodcast) {
      return;
    }

    try {
      const updated = await updateAdminPodcast(
        token,
        selectedPodcast.podcastId,
        payload
      );
      replacePodcast(updated);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handlePodcastCreate(event) {
    event.preventDefault();
    try {
      const formData = new FormData(event.currentTarget);
      const created = await createAdminPodcast(token, formData);
      replacePodcast(created);
      event.currentTarget.reset();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function requestInfo() {
    if (!selectedStory) {
      return;
    }

    try {
      const updated = await requestStoryInfo(token, selectedStory.storyId, note);
      replaceStory(updated);
      setNote("");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (!token) {
    return (
      <div className="page page--narrow">
        <section className="admin-login">
          <LockKeyhole size={34} />
          <h1>Admin Portal</h1>
          <p className="muted">
            Use the private credentials set in <strong>server/.env</strong>.
            Restart the API after changing admin credentials.
          </p>
          {error ? <p className="alert alert--danger">{error}</p> : null}
          <form onSubmit={handleLogin}>
            <input
              value={credentials.username}
              onChange={(event) =>
                setCredentials({ ...credentials, username: event.target.value })
              }
              placeholder="Username"
              required
            />
            <input
              value={credentials.password}
              type="password"
              onChange={(event) =>
                setCredentials({ ...credentials, password: event.target.value })
              }
              placeholder="Password"
              required
            />
            <button className="button button--dark" type="submit">
              Enter
            </button>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <ShieldCheck size={22} />
          <strong>Editorial Control</strong>
        </div>

        <div className="admin-stat-grid">
          <article>
            <BarChart3 size={20} />
            <span>Total</span>
            <strong>{stats?.totalStories ?? "-"}</strong>
          </article>
          <article>
            <Clock size={20} />
            <span>Queue</span>
            <strong>{stats?.queueStories ?? "-"}</strong>
          </article>
          <article>
            <Eye size={20} />
            <span>Published</span>
            <strong>{stats?.publishedStories ?? "-"}</strong>
          </article>
          <article>
            <FileText size={20} />
            <span>Evidence</span>
            <strong>{stats?.evidenceCount ?? "-"}</strong>
          </article>
          <article>
            <Headphones size={20} />
            <span>Podcasts</span>
            <strong>{stats?.publishedPodcasts ?? "-"}</strong>
          </article>
          <article>
            <MessageCircle size={20} />
            <span>Comments</span>
            <strong>{stats?.pendingComments ?? "-"}</strong>
          </article>
        </div>

        <label className="admin-filter">
          Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All</option>
            {meta.statuses.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>

        <form
          className="admin-search"
          onSubmit={(event) => {
            event.preventDefault();
            loadAdmin();
          }}
        >
          <Search size={17} />
          <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search queue" />
        </form>

        <button className="button button--ghost button--wide" type="button" onClick={() => loadAdmin()}>
          <RefreshCcw size={17} />
          Refresh
        </button>

        {error ? <p className="alert alert--danger">{error}</p> : null}
      </aside>

      <section className="admin-main">
        <div className="admin-toolbar">
          <div>
            <span className="eyebrow">Moderation</span>
            <h1>Submission Queue</h1>
          </div>
          <button
            className="button button--ghost"
            type="button"
            onClick={() => {
              localStorage.removeItem("uncovered-admin-token");
              setToken("");
            }}
          >
            Sign out
          </button>
        </div>

        <div className="admin-layout">
          <div className="admin-list" aria-busy={loading}>
            {stories.map((story) => (
              <button
                key={story.storyId}
                type="button"
                className={selectedStory?.storyId === story.storyId ? "is-selected" : ""}
                onClick={() => setSelectedId(story.storyId)}
              >
                <span>{story.storyId}</span>
                <strong>{story.title}</strong>
                <small>
                  {story.category} / {story.country}
                </small>
                <StatusBadge value={story.status} />
              </button>
            ))}
          </div>

          <div className="admin-detail">
            {selectedStory ? (
              <>
                <div className="admin-detail__header">
                  <div>
                    <span className="eyebrow">{selectedStory.storyId}</span>
                    <h2>{selectedStory.title}</h2>
                    <p>{selectedStory.body}</p>
                  </div>
                  <StatusBadge value={selectedStory.verificationLabel} />
                </div>

                <div className="admin-detail__facts">
                  <span>{selectedStory.category}</span>
                  <span>{selectedStory.intent}</span>
                  <span>{selectedStory.urgency}</span>
                  <span>{selectedStory.country}</span>
                  <span>
                    {selectedStory.submissionMode === "account"
                      ? "Account submission"
                      : "Anonymous guest"}
                  </span>
                  <span>{(selectedStory.storyInputTypes || ["typed"]).join(" + ")}</span>
                  <span>{selectedStory.evidence?.length || 0} evidence files</span>
                </div>

                <div className="admin-controls">
                  <label>
                    Status
                    <select
                      value={selectedStory.status}
                      onChange={(event) => patchStory({ status: event.target.value })}
                    >
                      {meta.statuses.map((status) => (
                        <option key={status} value={status}>
                          {status.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Verification
                    <select
                      value={selectedStory.verificationLabel}
                      onChange={(event) =>
                        patchStory({ verificationLabel: event.target.value })
                      }
                    >
                      {meta.verificationLabels.map((label) => (
                        <option key={label} value={label}>
                          {label.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="admin-controls admin-controls--publishing">
                  <label>
                    Publishing identity
                    <select
                      value={selectedStory.publishingPreference || "anonymous"}
                      onChange={(event) =>
                        patchStory({ publishingPreference: event.target.value })
                      }
                    >
                      {(meta.publishingIdentities || ["anonymous"]).map((identity) => (
                        <option key={identity} value={identity}>
                          {identity.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Voice treatment
                    <select
                      value={selectedStory.voiceTreatment || "read_as_submitted"}
                      onChange={(event) => patchStory({ voiceTreatment: event.target.value })}
                    >
                      {(meta.voiceTreatments || ["read_as_submitted"]).map((treatment) => (
                        <option key={treatment} value={treatment}>
                          {treatment.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Latest expiry
                    <input
                      type="datetime-local"
                      value={
                        selectedStory.latestExpiresAt
                          ? new Date(selectedStory.latestExpiresAt).toISOString().slice(0, 16)
                          : ""
                      }
                      onChange={(event) =>
                        patchStory({ latestExpiresAt: event.target.value || null })
                      }
                    />
                  </label>

                  <label className="admin-toggle">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedStory.showInLatest)}
                      onChange={(event) =>
                        patchStory({ showInLatest: event.target.checked })
                      }
                    />
                    <span>Show in Latest</span>
                  </label>
                </div>

                {selectedStory.faceless ? (
                  <section className="publish-safety">
                    <h3>Faceless Voices publish safety</h3>
                    {[
                      ["identityReviewed", "Identity reviewed"],
                      ["contactHidden", "Contact hidden"],
                      ["evidencePrivate", "Evidence stays private"],
                      ["namesChanged", "Names changed if needed"],
                      ["locationsChanged", "Locations changed if needed"],
                      ["consentReviewed", "Consent reviewed"]
                    ].map(([key, label]) => (
                      <label key={key}>
                        <input
                          type="checkbox"
                          checked={Boolean(selectedStory.moderation?.publishSafety?.[key])}
                          onChange={(event) =>
                            patchStory({
                              publishSafety: {
                                ...(selectedStory.moderation?.publishSafety || {}),
                                [key]: event.target.checked
                              }
                            })
                          }
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </section>
                ) : null}

                <div className="quick-actions">
                  <button
                    type="button"
                    onClick={() => patchStory({ status: "published", moderationNote: note })}
                  >
                    <CheckCircle2 size={18} />
                    Publish
                  </button>
                  <button
                    type="button"
                    onClick={() => patchStory({ status: "rejected", moderationNote: note })}
                  >
                    <XCircle size={18} />
                    Reject
                  </button>
                  <button
                    type="button"
                    className={selectedStory.featured ? "is-active" : ""}
                    onClick={() => patchStory({ featured: !selectedStory.featured })}
                  >
                    <Star size={18} />
                    Feature
                  </button>
                  <button
                    type="button"
                    className={selectedStory.pinned ? "is-active" : ""}
                    onClick={() => patchStory({ pinned: !selectedStory.pinned })}
                  >
                    <Pin size={18} />
                    Pin
                  </button>
                </div>

                <label className="admin-note">
                  Moderation note
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Request details, document needs, publication notes"
                  />
                </label>

                <div className="quick-actions quick-actions--secondary">
                  <button type="button" onClick={requestInfo}>
                    Request Info
                  </button>
                  <button
                    type="button"
                    onClick={() => patchStory({ solved: !selectedStory.solved })}
                  >
                    {selectedStory.solved ? "Unmark Solved" : "Mark Solved"}
                  </button>
                </div>

                <div className="admin-columns">
                  <section>
                    <h3>Contact</h3>
                    <p>{selectedStory.contact?.name || "No name"}</p>
                    <p>{selectedStory.contact?.email || "No email"}</p>
                    <p>{selectedStory.contact?.phone || "No phone"}</p>
                    <p>{selectedStory.contact?.preferredMethod || "email"}</p>
                    <p>
                      {selectedStory.authorUserId
                        ? `Account: ${selectedStory.authorUserId}`
                        : "No linked account"}
                    </p>
                  </section>
                  <section>
                    <h3>Evidence</h3>
                    {(selectedStory.evidence || []).length ? (
                      selectedStory.evidence.map((file, index) => (
                        <div className="admin-evidence" key={file.filename || `${file.originalName}-${index}`}>
                          <strong>{file.originalName}</strong>
                          <p>{file.supportsLine || "No supported line noted"}</p>
                          <p>{file.description || "No evidence note provided"}</p>
                        </div>
                      ))
                    ) : (
                      <p>No files uploaded</p>
                    )}
                  </section>
                  <section>
                    <h3>Audio and queue</h3>
                    {selectedStory.storyAudio?.filename ? (
                      <div className="admin-audio">
                        <Volume2 size={18} />
                        <strong>{selectedStory.storyAudio.originalName}</strong>
                        <audio
                          className="audio-player"
                          controls
                          src={`/uploads/${selectedStory.storyAudio.filename}`}
                        >
                          <track kind="captions" />
                        </audio>
                      </div>
                    ) : (
                      <p>No story audio uploaded</p>
                    )}
                    <p>{(selectedStory.comments || []).filter((item) => item.status === "pending").length} pending</p>
                  </section>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <h2>No submissions</h2>
                <p>The queue is clear for the current filters.</p>
              </div>
            )}
          </div>
        </div>

        <section className="admin-podcast-panel">
          <div className="section-grid">
            <div className="section-heading">
              <span className="eyebrow">
                <Headphones size={16} />
                Podcast publishing
              </span>
              <h2>Audio stories</h2>
            </div>
          </div>

          <form className="podcast-admin-form" onSubmit={handlePodcastCreate}>
            <input name="title" placeholder="Episode title" required />
            <input name="linkedStoryId" placeholder="Linked Story ID" />
            <input name="coverImageUrl" placeholder="Cover image URL" />
            <textarea name="description" placeholder="Episode description" required />
            <textarea name="uncoveredNote" placeholder="What story did this uncover?" />
            <input name="audio" type="file" accept="audio/*" />
            <select name="status" defaultValue="draft">
              {(meta.contentStatuses || ["draft", "published"]).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <label className="admin-toggle">
              <input type="checkbox" name="showInLatest" value="true" />
              <span>Show in Latest</span>
            </label>
            <label>
              Latest expiry
              <input name="latestExpiresAt" type="datetime-local" />
            </label>
            <button className="button button--accent" type="submit">
              <Upload size={17} />
              Add Podcast
            </button>
          </form>

          <div className="podcast-admin-grid">
            <div className="admin-list">
              {podcasts.map((podcast) => (
                <button
                  key={podcast.podcastId}
                  type="button"
                  className={selectedPodcast?.podcastId === podcast.podcastId ? "is-selected" : ""}
                  onClick={() => setSelectedPodcastId(podcast.podcastId)}
                >
                  <span>{podcast.podcastId}</span>
                  <strong>{podcast.title}</strong>
                  <small>{podcast.status}</small>
                </button>
              ))}
            </div>

            {selectedPodcast ? (
              <div className="admin-detail">
                <div className="admin-detail__header">
                  <div>
                    <span className="eyebrow">{selectedPodcast.podcastId}</span>
                    <h2>{selectedPodcast.title}</h2>
                    <p>{selectedPodcast.description}</p>
                  </div>
                  <StatusBadge value={selectedPodcast.status} />
                </div>

                <div className="admin-controls">
                  <label>
                    Status
                    <select
                      value={selectedPodcast.status}
                      onChange={(event) => patchPodcast({ status: event.target.value })}
                    >
                      {(meta.contentStatuses || ["draft", "published"]).map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Latest expiry
                    <input
                      type="datetime-local"
                      value={
                        selectedPodcast.latestExpiresAt
                          ? new Date(selectedPodcast.latestExpiresAt).toISOString().slice(0, 16)
                          : ""
                      }
                      onChange={(event) =>
                        patchPodcast({ latestExpiresAt: event.target.value || null })
                      }
                    />
                  </label>
                  <label className="admin-toggle">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedPodcast.showInLatest)}
                      onChange={(event) =>
                        patchPodcast({ showInLatest: event.target.checked })
                      }
                    />
                    <span>Show in Latest</span>
                  </label>
                </div>

                {selectedPodcast.audioUrl ? (
                  <audio controls className="audio-player" src={selectedPodcast.audioUrl} />
                ) : (
                  <p className="muted">No audio file attached yet.</p>
                )}
              </div>
            ) : null}
          </div>
        </section>
      </section>
    </div>
  );
}
