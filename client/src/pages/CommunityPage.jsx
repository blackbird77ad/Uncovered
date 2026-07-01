import { Bookmark, Flag, HeartHandshake, MessageCircle, Share2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function CommunityPage() {
  return (
    <div className="page page--narrow">
      <section className="page-title">
        <span className="eyebrow">
          <HeartHandshake size={16} />
          Community
        </span>
        <h1>Advice instead of noise.</h1>
        <p>
          UNCOVERED community tools are designed around practical help, careful
          sharing, saved stories, and moderator response.
        </p>
      </section>

      <section className="workflow-band workflow-band--light">
        <article>
          <MessageCircle size={24} />
          <h3>Advice</h3>
          <p>Responses enter moderation and focus on actionable support.</p>
        </article>
        <article>
          <Bookmark size={24} />
          <h3>Bookmark</h3>
          <p>Readers can keep track of developing timelines.</p>
        </article>
        <article>
          <Share2 size={24} />
          <h3>Share</h3>
          <p>Story sharing contributes to editorial trend signals.</p>
        </article>
        <article>
          <Flag size={24} />
          <h3>Report</h3>
          <p>Reports feed admin analytics for moderation review.</p>
        </article>
      </section>

      <div className="center-action">
        <Link className="button button--dark" to="/stories">
          Browse Stories
        </Link>
      </div>
    </div>
  );
}
