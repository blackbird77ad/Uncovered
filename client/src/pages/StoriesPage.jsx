import { Filter, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getConfig, getErrorMessage, getFeed, getStories } from "../api/client.js";
import ContentCard from "../components/ContentCard.jsx";
import StoryCard from "../components/StoryCard.jsx";
import SEO from "../components/SEO.jsx";
import { fallbackCategories } from "../data/fallbackConfig.js";

export default function StoriesPage({
  title,
  subtitle,
  vertical = "",
  sort = "latest",
  includePodcasts = false
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stories, setStories] = useState([]);
  const [categories, setCategories] = useState(fallbackCategories);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState(searchParams.get("q") || "");
  const category = searchParams.get("category") || "All";

  const query = useMemo(
    () => ({
      q: searchParams.get("q") || "",
      category,
      vertical,
      sort,
      limit: 30
    }),
    [category, searchParams, sort, vertical]
  );

  useEffect(() => {
    getConfig()
      .then((config) => setCategories(["All", ...(config.categories || [])]))
      .catch(() => setCategories(["All", ...fallbackCategories]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const loader = includePodcasts ? getFeed : getStories;
    loader(query)
      .then((items) => {
        setStories(items);
        setError("");
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [query]);

  function updateFilters(next) {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (!value || value === "All") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    setSearchParams(params);
  }

  function submitSearch(event) {
    event.preventDefault();
    updateFilters({ q });
  }

  return (
    <div className="page page--narrow">
      <SEO title={title} description={subtitle} />
      <section className="page-title">
        <span className="eyebrow">
          <Filter size={16} />
          UNCOVERED desk
        </span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </section>

      <section className="filters-panel">
        <form className="search-box" onSubmit={submitSearch}>
          <Search size={18} />
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search stories"
          />
          <button className="button button--dark" type="submit">
            Search
          </button>
        </form>

        <div className="filter-chips">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className={item === category ? "is-active" : ""}
              onClick={() => updateFilters({ category: item })}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {loading ? <p className="muted">Loading stories...</p> : null}
      {error ? <p className="alert alert--danger">{error}</p> : null}

      <section className="story-grid story-grid--wide">
        {stories.map((story) => (
          includePodcasts ? (
            <ContentCard key={story.storyId || story.podcastId} item={story} />
          ) : (
            <StoryCard key={story.storyId} story={story} />
          )
        ))}
      </section>

      {!loading && !stories.length ? (
        <div className="empty-state">
          <h2>No stories found</h2>
          <p>Try a different search or category.</p>
        </div>
      ) : null}
    </div>
  );
}
