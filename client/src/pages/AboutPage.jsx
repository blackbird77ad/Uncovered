import { Eye, Newspaper, ShieldCheck, Users } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="page page--narrow">
      <section className="page-title">
        <span className="eyebrow">
          <Newspaper size={16} />
          Brand blueprint
        </span>
        <h1>Every story deserves to be heard.</h1>
        <p>
          UNCOVERED blends community submissions, investigative editing, podcasts,
          and documentary storytelling.{" "}
          <span className="text-highlight">Faceless Voices</span> protects identity
          while helping urgent stories reach the public.
        </p>
      </section>

      <section className="workflow-band workflow-band--light">
        <article>
          <Eye size={24} />
          <h3>Trustworthy</h3>
          <p>Stories move through review, verification labels, and editorial context.</p>
        </article>
        <article>
          <ShieldCheck size={24} />
          <h3>Protective</h3>
          <p>Private contact details and evidence stay out of public story payloads.</p>
        </article>
        <article>
          <Users size={24} />
          <h3>Human</h3>
          <p>The platform favors comments, follow-up timelines, and measured community help.</p>
        </article>
      </section>
    </div>
  );
}
