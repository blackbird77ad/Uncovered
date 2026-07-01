import { FileText, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import SEO from "../components/SEO.jsx";

const policies = [
  {
    icon: ShieldCheck,
    title: "Editorial standards",
    body:
      "UNCOVERED publishes personal accounts with care, context, and moderation. We avoid exposing private people unnecessarily and label verification clearly."
  },
  {
    icon: FileText,
    title: "Privacy",
    body:
      "Contact details, evidence paths, and consent records are private admin data. Public stories receive only safe display fields."
  },
  {
    icon: RotateCcw,
    title: "Corrections and add-ups",
    body:
      "Original submissions are preserved. Authors can submit missing points, clarifications, line references, or wording notes as moderated add-ups."
  },
  {
    icon: Trash2,
    title: "Takedown requests",
    body:
      "People can contact the desk about safety, privacy, or factual concerns. Editors review requests before changing public availability."
  }
];

export default function PoliciesPage() {
  return (
    <div className="page page--narrow">
      <SEO
        title="Editorial Policies"
        description="UNCOVERED editorial standards, privacy, corrections, add-ups, and takedown policy."
      />
      <section className="page-title">
        <span className="eyebrow">
          <FileText size={16} />
          Editorial policies
        </span>
        <h1>Clear rules for sensitive stories.</h1>
        <p>
          These policies keep the platform honest: original stories are preserved,
          public versions are moderated, and safety concerns can be reviewed.
        </p>
      </section>

      <section className="trust-grid">
        {policies.map((policy) => {
          const Icon = policy.icon;
          return (
            <article key={policy.title}>
              <Icon size={24} />
              <h2>{policy.title}</h2>
              <p>{policy.body}</p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
