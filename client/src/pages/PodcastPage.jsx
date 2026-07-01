import { FileText, Headphones, Mic2, Radio, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getErrorMessage, getPodcasts } from "../api/client.js";
import ContentCard from "../components/ContentCard.jsx";
import SEO from "../components/SEO.jsx";

export default function PodcastPage() {
  const [podcasts, setPodcasts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getPodcasts({ limit: 20 })
      .then(setPodcasts)
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  return (
    <div className="page page--narrow">
      <SEO
        title="Podcast and Audio Stories"
        description="Listen to UNCOVERED podcast episodes and voice readings based on approved story submissions."
      />
      <section className="page-title">
        <span className="eyebrow">
          <Radio size={16} />
          Uncovered Podcast
        </span>
        <h1>From submission to episode.</h1>
        <p>
          Approved submissions can become narrated stories, podcast episodes, or
          written posts. The editorial team can link each episode to the story it uncovered.
        </p>
      </section>

      <section className="podcast-board">
        <article>
          <FileText size={24} />
          <h3>Source story</h3>
          <p>Moderated submissions retain Story ID context and chronology.</p>
        </article>
        <article>
          <Sparkles size={24} />
          <h3>Protected adaptation</h3>
          <p>Characters, names, or locations can be changed before narration.</p>
        </article>
        <article>
          <Mic2 size={24} />
          <h3>Episode prep</h3>
          <p>Stories move into interview notes, narration, and publishing queues.</p>
        </article>
      </section>

      <section className="section-grid">
        <div className="section-heading">
          <span className="eyebrow">
            <Headphones size={16} />
            Listen
          </span>
          <h2>Latest audio stories</h2>
        </div>
        <Link className="section-heading__link" to="/submit">
          Submit Story
        </Link>
      </section>

      {error ? <p className="alert alert--danger">{error}</p> : null}

      <section className="story-grid story-grid--wide">
        {podcasts.map((podcast) => (
          <ContentCard key={podcast.podcastId} item={podcast} />
        ))}
      </section>
    </div>
  );
}
