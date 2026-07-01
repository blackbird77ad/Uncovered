import {
  Bookmark,
  CalendarClock,
  FileWarning,
  Eye,
  Flag,
  Heart,
  MapPin,
  MessageCircle,
  Send,
  Share2,
  Star,
  ShieldCheck,
  Volume2
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  clearUserSession,
  getErrorMessage,
  getCurrentUser,
  getStoredUser,
  getStoredUserToken,
  getStory,
  reactToStory,
  submitComment,
  submitStoryUpdate
} from "../api/client.js";
import SEO from "../components/SEO.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

function formatDate(value) {
  if (!value) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export default function StoryDetailPage() {
  const { slugOrId } = useParams();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [userToken, setUserToken] = useState(() => getStoredUserToken());
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [comment, setComment] = useState({ name: "", message: "" });
  const [update, setUpdate] = useState({
    type: "missing_point",
    referenceLine: "",
    suggestedWording: "",
    body: ""
  });

  useEffect(() => {
    setLoading(true);
    getStory(slugOrId)
      .then((item) => {
        setStory(item);
        setError("");
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [slugOrId]);

  useEffect(() => {
    if (!userToken) {
      setCurrentUser(null);
      return;
    }

    getCurrentUser(userToken)
      .then((user) => setCurrentUser(user))
      .catch(() => {
        clearUserSession();
        setUserToken("");
        setCurrentUser(null);
      });
  }, [userToken]);

  async function handleReaction(type) {
    if (!story) {
      return;
    }

    try {
      const updated = await reactToStory(story.storyId, type);
      setStory(updated);
      setNotice(type === "report" ? "Report received." : "Saved.");
    } catch (err) {
      setNotice(getErrorMessage(err));
    }
  }

  async function handleComment(event) {
    event.preventDefault();
    setNotice("");

    try {
      const response = await submitComment(story.storyId, comment);
      setStory(response.story);
      setComment({ name: "", message: "" });
      setNotice(response.message);
    } catch (err) {
      setNotice(getErrorMessage(err));
    }
  }

  async function handleUpdate(event) {
    event.preventDefault();
    setNotice("");

    try {
      const response = await submitStoryUpdate(story.storyId, update, userToken);
      setStory(response.story);
      setUpdate({
        type: "missing_point",
        referenceLine: "",
        suggestedWording: "",
        body: ""
      });
      setNotice(response.message);
    } catch (err) {
      setNotice(getErrorMessage(err));
    }
  }

  if (loading) {
    return (
      <div className="page page--narrow">
        <p className="muted">Loading story...</p>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="page page--narrow">
        <div className="empty-state">
          <h1>Story unavailable</h1>
          <p>{error || "This story could not be found."}</p>
          <Link className="button button--dark" to="/stories">
            Browse Stories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page story-detail-page">
      <SEO title={story.title} description={story.body} />
      <article className="story-detail">
        <header className="story-detail__header">
          <div className="story-detail__image" style={{ backgroundImage: `url(${story.imageUrl})` }} />

          <div className="story-detail__headline">
            <div className="story-card__meta">
              {story.faceless ? <span className="faceless-pill">Faceless Voices</span> : null}
              <span>{story.category}</span>
              <StatusBadge value={story.verificationLabel} />
              {story.solved ? <StatusBadge value="solved" /> : null}
            </div>
            <h1>{story.title}</h1>
            <p>{story.body}</p>

            {(story.sensitiveFlags || []).length ? (
              <div className="content-warning">
                <FileWarning size={18} />
                <span>Content notes: {story.sensitiveFlags.join(", ")}</span>
              </div>
            ) : null}

            <div className="story-detail__facts">
              <span>
                <MapPin size={16} />
                {story.regionCity ? `${story.regionCity}, ` : ""}
                {story.country}
              </span>
              <span>
                <CalendarClock size={16} />
                {story.happenedAt || formatDate(story.publishedAt)}
              </span>
              <span>
                <ShieldCheck size={16} />
                {story.faceless ? "Faceless Voices protected" : story.displayName}
              </span>
            </div>
          </div>
        </header>

        <aside className="story-actions">
          <button type="button" onClick={() => handleReaction("helpful")}>
            <Heart size={18} />
            Like
          </button>
          <button type="button" onClick={() => handleReaction("favorite")}>
            <Star size={18} />
            Favourite
          </button>
          <button type="button" onClick={() => handleReaction("follow")}>
            <ShieldCheck size={18} />
            Follow
          </button>
          <button type="button" onClick={() => handleReaction("bookmark")}>
            <Bookmark size={18} />
            Bookmark
          </button>
          <button type="button" onClick={() => handleReaction("share")}>
            <Share2 size={18} />
            Share
          </button>
          <button type="button" onClick={() => handleReaction("report")}>
            <Flag size={18} />
            Report
          </button>
        </aside>

        {notice ? <p className="alert">{notice}</p> : null}

        <section className="story-metrics">
          <span>
            <Eye size={17} />
            {story.stats?.views || 0} views
          </span>
          <span>
            <Heart size={17} />
            {story.stats?.likes || story.stats?.helpful || 0} likes
          </span>
          <span>
            <Star size={17} />
            {story.stats?.favorites || 0} favourites
          </span>
          <span>
            <MessageCircle size={17} />
            {story.comments?.length || 0} comments
          </span>
        </section>

        <section className="verification-note">
          <ShieldCheck size={20} />
          <p>
            Verification label: <strong>{story.verificationLabel?.replaceAll("_", " ")}</strong>.
            This tells readers what the editorial team has reviewed before publication.
          </p>
        </section>

        {story.storyAudio?.audioUrl ? (
          <section className="verification-note">
            <Volume2 size={20} />
            <p>
              Audio story available. Listen only if voice publication feels safe
              for the submitter and the moderated version has been approved.
            </p>
            <audio className="audio-player" controls src={story.storyAudio.audioUrl}>
              <track kind="captions" />
            </audio>
          </section>
        ) : null}

        <section className="story-section">
          <h2>Timeline</h2>
          <div className="timeline">
            <article>
              <span>{formatDate(story.createdAt)}</span>
              <p>Original story submitted as {story.storyId}.</p>
            </article>
            {(story.updates || []).map((item, index) => (
              <article key={`${item.createdAt}-${index}`}>
                <span>{formatDate(item.createdAt)}</span>
                <strong>{item.type?.replaceAll("_", " ") || "Add-up"}</strong>
                {item.referenceLine ? <small>Reference: {item.referenceLine}</small> : null}
                {item.suggestedWording ? (
                  <small>Suggested wording: {item.suggestedWording}</small>
                ) : null}
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="story-section story-section--split">
          <div>
            <h2>Comments</h2>
            <div className="advice-list">
              {(story.comments || []).length ? (
                story.comments.map((item, index) => (
                  <article key={`${item.createdAt}-${index}`}>
                    <strong>{item.name}</strong>
                    <p>{item.message}</p>
                  </article>
                ))
              ) : (
                <p className="muted">No approved comments yet.</p>
              )}
            </div>
          </div>

          <form className="panel-form" onSubmit={handleComment}>
            <h3>Add comment</h3>
            <input
              value={comment.name}
              onChange={(event) => setComment({ ...comment, name: event.target.value })}
              placeholder="Name or nickname"
            />
            <textarea
              value={comment.message}
              onChange={(event) => setComment({ ...comment, message: event.target.value })}
              placeholder="Your comment"
              required
              minLength={10}
            />
            <button className="button button--dark" type="submit">
              <Send size={17} />
              Submit Comment
            </button>
          </form>
        </section>

        <section className="story-section story-section--split">
          <div>
            <h2>Add up to this story</h2>
            <p className="muted">
              The original stays unchanged. Use this for missing points,
              clarifications, line references, or wording notes.
            </p>
          </div>

          {story.acceptsAuthorAddUps ? (
            currentUser ? (
              <form className="panel-form" onSubmit={handleUpdate}>
                <p className="muted">Signed in as {currentUser.email}</p>
                <select
                  value={update.type}
                  onChange={(event) => setUpdate({ ...update, type: event.target.value })}
                >
                  <option value="missing_point">Missing point</option>
                  <option value="clarification">Clarification</option>
                  <option value="line_reference">Reference a line</option>
                  <option value="wording_change">Say it differently</option>
                  <option value="new_development">New development</option>
                </select>
                <input
                  value={update.referenceLine}
                  onChange={(event) => setUpdate({ ...update, referenceLine: event.target.value })}
                  placeholder="Line or phrase you are referencing"
                />
                <input
                  value={update.suggestedWording}
                  onChange={(event) =>
                    setUpdate({ ...update, suggestedWording: event.target.value })
                  }
                  placeholder="Optional wording you prefer"
                />
                <textarea
                  value={update.body}
                  onChange={(event) => setUpdate({ ...update, body: event.target.value })}
                  placeholder="What do you want to add, clarify, or correct?"
                  required
                  minLength={20}
                />
                <button className="button button--accent" type="submit">
                  <Send size={17} />
                  Submit Add-up
                </button>
              </form>
            ) : (
              <div className="panel-form">
                <h3>Log in to add up</h3>
                <p className="muted">
                  Only the account that submitted this story can add missing
                  points or clarifications.
                </p>
                <Link className="button button--dark" to="/account">
                  Log In
                </Link>
              </div>
            )
          ) : (
            <div className="panel-form">
              <h3>Anonymous guest story</h3>
              <p className="muted">
                This story was submitted without an account. To protect that
                userless path, it cannot receive author add-ups through the site.
              </p>
            </div>
          )}
        </section>
      </article>
    </div>
  );
}
