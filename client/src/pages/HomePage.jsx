import {
  ArrowRight,
  FileText,
  Flame,
  LockKeyhole,
  MessageSquareHeart,
  Mic2,
  ShieldCheck,
  Sparkles,
  Upload
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getErrorMessage, getFeed } from "../api/client.js";
import ContentCard from "../components/ContentCard.jsx";
import SEO from "../components/SEO.jsx";

const categoryHighlights = [
  "Faceless Voices",
  "Need Help ASAP",
  "Warning/Caution",
  "Scam/Fraud",
  "Crime",
  "Workplace",
  "Mental Health",
  "Success Story"
];

export default function HomePage() {
  const [stories, setStories] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getFeed({ limit: 7 })
      .then(setStories)
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  const leadStory = stories[0];
  const supportingStories = useMemo(() => stories.slice(1, 5), [stories]);

  return (
    <div className="page">
      <SEO
        title="Stories the media missed"
        description="UNCOVERED publishes personal stories, Faceless Voices submissions, voice readings, and podcast episodes."
      />
      <section className="home-lead">
        <div className="home-lead__copy">
          <div className="eyebrow">
            <ShieldCheck size={16} />
            Stories the media missed
          </div>
          <h1>UNCOVERED</h1>
          <p>
            The stories behind the headlines. Submit warnings, lived experience,
            personal accounts, and anonymous evidence through{" "}
            <Link className="text-highlight" to="/faceless-voices">
              Faceless Voices
            </Link>
            .
          </p>
          <div className="home-lead__actions">
            <Link className="button button--accent" to="/submit">
              <Upload size={18} />
              Submit Story
            </Link>
            <Link className="button button--ghost" to="/stories">
              Latest Stories
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        {leadStory ? (
          <Link
            className="lead-story"
            to={
              leadStory.contentType === "podcast"
                ? `/podcast/${leadStory.slug || leadStory.podcastId}`
                : `/stories/${leadStory.slug || leadStory.storyId}`
            }
            style={{ backgroundImage: `url(${leadStory.imageUrl || leadStory.coverImageUrl})` }}
          >
            <span>{leadStory.contentType === "podcast" ? "Audio Story" : leadStory.category}</span>
            <h2>{leadStory.title}</h2>
            <p>{leadStory.body || leadStory.description}</p>
          </Link>
        ) : (
          <div className="lead-story lead-story--empty">
            <span>Loading desk</span>
            <h2>{error || "Gathering latest stories"}</h2>
          </div>
        )}
      </section>

      <section className="category-rail" aria-label="Story categories">
        {categoryHighlights.map((category) => (
          <Link
            key={category}
            className={category === "Faceless Voices" ? "category-rail__faceless" : ""}
            to={
              category === "Faceless Voices"
                ? "/faceless-voices"
                : `/stories?category=${encodeURIComponent(category)}`
            }
          >
            {category}
          </Link>
        ))}
      </section>

      <section className="faceless-banner">
        <div>
          <span className="eyebrow">
            <LockKeyhole size={16} />
            Faceless Voices
          </span>
          <h2>Anonymous stories get a protected path.</h2>
        </div>
        <Link className="button button--dark" to="/faceless-voices">
          Explore Faceless Voices
          <ArrowRight size={18} />
        </Link>
      </section>

      <section className="section-grid">
        <div className="section-heading">
          <span className="eyebrow">
            <Flame size={16} />
            Developing
          </span>
          <h2>Latest from the community</h2>
        </div>
        <Link className="section-heading__link" to="/trending">
          Trending
          <ArrowRight size={17} />
        </Link>
      </section>

      <section className="story-grid">
        {supportingStories.map((story) => (
          <ContentCard key={story.storyId || story.podcastId} item={story} />
        ))}
      </section>

      <section className="workflow-band">
        <article>
          <FileText size={24} />
          <h3>Story ID timeline</h3>
          <p>Original submissions stay preserved while updates attach chronologically.</p>
        </article>
        <article>
          <MessageSquareHeart size={24} />
          <h3>Advice over noise</h3>
          <p>Community responses are framed around practical support and moderation.</p>
        </article>
        <article>
          <Mic2 size={24} />
          <h3>Voice and podcast</h3>
          <p>Approved stories can become voice readings, episodes, or written posts.</p>
        </article>
        <article>
          <Sparkles size={24} />
          <h3>AI-assisted review</h3>
          <p>Editorial tooling tracks PII, duplicate reports, fraud signals, and labels.</p>
        </article>
      </section>
    </div>
  );
}
