import { Headphones, Heart, MessageCircle, Send, Share2, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getErrorMessage,
  getPodcast,
  reactToPodcast,
  submitPodcastComment
} from "../api/client.js";
import SEO from "../components/SEO.jsx";

export default function PodcastDetailPage() {
  const { slugOrId } = useParams();
  const [podcast, setPodcast] = useState(null);
  const [comment, setComment] = useState({ name: "", message: "" });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getPodcast(slugOrId)
      .then((item) => {
        setPodcast(item);
        setError("");
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, [slugOrId]);

  async function handleReaction(type) {
    try {
      const updated = await reactToPodcast(podcast.podcastId, type);
      setPodcast(updated);
      setNotice("Saved.");
    } catch (err) {
      setNotice(getErrorMessage(err));
    }
  }

  async function handleComment(event) {
    event.preventDefault();
    try {
      const response = await submitPodcastComment(podcast.podcastId, comment);
      setPodcast(response.podcast);
      setComment({ name: "", message: "" });
      setNotice(response.message);
    } catch (err) {
      setNotice(getErrorMessage(err));
    }
  }

  if (error) {
    return (
      <div className="page page--narrow">
        <div className="empty-state">
          <h1>Podcast unavailable</h1>
          <p>{error}</p>
          <Link className="button button--dark" to="/podcast">
            Back to Podcast
          </Link>
        </div>
      </div>
    );
  }

  if (!podcast) {
    return (
      <div className="page page--narrow">
        <p className="muted">Loading podcast...</p>
      </div>
    );
  }

  return (
    <div className="page page--narrow">
      <SEO title={podcast.title} description={podcast.description} />
      <section className="podcast-hero">
        <div
          className="podcast-hero__cover"
          style={{ backgroundImage: `url(${podcast.coverImageUrl})` }}
        />
        <div>
          <span className="eyebrow">
            <Headphones size={16} />
            Audio Story
          </span>
          <h1>{podcast.title}</h1>
          <p>{podcast.description}</p>
          {podcast.audioUrl ? (
            <audio controls src={podcast.audioUrl} className="audio-player" />
          ) : (
            <p className="alert">Audio file coming soon.</p>
          )}
          {podcast.linkedStoryId ? (
            <p className="muted">Uncovered from story {podcast.linkedStoryId}</p>
          ) : null}
        </div>
      </section>

      <aside className="story-actions">
        <button type="button" onClick={() => handleReaction("like")}>
          <Heart size={18} />
          Like
        </button>
        <button type="button" onClick={() => handleReaction("favorite")}>
          <Star size={18} />
          Favourite
        </button>
        <button type="button" onClick={() => handleReaction("share")}>
          <Share2 size={18} />
          Share
        </button>
      </aside>

      {notice ? <p className="alert">{notice}</p> : null}

      <section className="story-metrics">
        <span>{podcast.stats?.listens || 0} listens</span>
        <span>{podcast.stats?.likes || 0} likes</span>
        <span>{podcast.stats?.favorites || 0} favourites</span>
        <span>{podcast.comments?.length || 0} comments</span>
      </section>

      <section className="story-section story-section--split">
        <div>
          <h2>Listener comments</h2>
          <div className="advice-list">
            {(podcast.comments || []).length ? (
              podcast.comments.map((item, index) => (
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
          />
          <button className="button button--dark" type="submit">
            <Send size={17} />
            Submit Comment
          </button>
        </form>
      </section>
    </div>
  );
}
