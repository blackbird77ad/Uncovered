import { Headphones, Heart, MessageCircle, Star } from "lucide-react";
import { Link } from "react-router-dom";
import StoryCard from "./StoryCard.jsx";

function compactNumber(value = 0) {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(value);
}

export default function ContentCard({ item }) {
  if (item.contentType !== "podcast") {
    return <StoryCard story={item} />;
  }

  return (
    <article className="story-card podcast-card">
      <Link
        className="story-card__media"
        to={`/podcast/${item.slug || item.podcastId}`}
        style={{ backgroundImage: `url(${item.coverImageUrl})` }}
        aria-label={item.title}
      >
        <span className="story-card__faceless">Audio Story</span>
      </Link>

      <div className="story-card__body">
        <div className="story-card__meta">
          <span>Podcast</span>
          {item.linkedStoryId ? <span>Uncovered from {item.linkedStoryId}</span> : null}
        </div>
        <h3>
          <Link to={`/podcast/${item.slug || item.podcastId}`}>{item.title}</Link>
        </h3>
        <p>{item.description}</p>

        <div className="story-card__stats">
          <span title="Listens">
            <Headphones size={15} />
            {compactNumber(item.stats?.listens)}
          </span>
          <span title="Likes">
            <Heart size={15} />
            {compactNumber(item.stats?.likes)}
          </span>
          <span title="Favorites">
            <Star size={15} />
            {compactNumber(item.stats?.favorites)}
          </span>
          <span title="Comments">
            <MessageCircle size={15} />
            {compactNumber(item.comments?.length)}
          </span>
        </div>
      </div>
    </article>
  );
}
