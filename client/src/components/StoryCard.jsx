import {
  Eye,
  FileText,
  Heart,
  MapPin,
  MessageCircle,
  Star,
  ShieldCheck
} from "lucide-react";
import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge.jsx";

function compactNumber(value = 0) {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(value);
}

export default function StoryCard({ story, featured = false }) {
  return (
    <article
      className={[
        "story-card",
        featured ? "story-card--featured" : "",
        story.faceless ? "story-card--faceless" : ""
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Link
        className="story-card__media"
        to={`/stories/${story.slug || story.storyId}`}
        style={{ backgroundImage: `url(${story.imageUrl})` }}
        aria-label={story.title}
      >
        {story.faceless ? (
          <span className="story-card__faceless">Faceless Voices</span>
        ) : null}
        {story.solved ? <span className="story-card__solved">Solved</span> : null}
      </Link>

      <div className="story-card__body">
        <div className="story-card__meta">
          <span>{story.category}</span>
          <StatusBadge value={story.verificationLabel} />
        </div>

        <h3>
          <Link to={`/stories/${story.slug || story.storyId}`}>{story.title}</Link>
        </h3>

        <p>{story.body}</p>

        <div className="story-card__context">
          <span>
            <MapPin size={15} />
            {story.country}
          </span>
          <span className={story.faceless ? "story-card__context-branch" : ""}>
            <ShieldCheck size={15} />
            {story.faceless ? "Faceless Voices" : story.displayName || "Public"}
          </span>
        </div>

        <div className="story-card__stats">
          <span title="Views">
            <Eye size={15} />
            {compactNumber(story.stats?.views)}
          </span>
          <span title="Helpful reactions">
            <Heart size={15} />
            {compactNumber(story.stats?.likes || story.stats?.helpful)}
          </span>
          <span title="Comments">
            <MessageCircle size={15} />
            {compactNumber(story.comments?.length)}
          </span>
          <span title="Favourites">
            <Star size={15} />
            {compactNumber(story.stats?.favorites || story.stats?.bookmarks)}
          </span>
          {story.evidence?.length ? (
            <span title="Evidence files">
              <FileText size={15} />
              {story.evidence.length}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
