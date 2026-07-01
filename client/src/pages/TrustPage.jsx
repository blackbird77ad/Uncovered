import { AlertTriangle, FileCheck2, LockKeyhole, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { getConfig } from "../api/client.js";
import SEO from "../components/SEO.jsx";

const fallbackPolicies = [
  {
    id: "faceless-voices",
    title: "Faceless Voices protection",
    body:
      "Anonymous submissions are reviewed with public identity, private contact, and evidence separated."
  }
];

export default function TrustPage() {
  const [config, setConfig] = useState({
    trustPolicies: fallbackPolicies,
    verificationExplainers: {}
  });

  useEffect(() => {
    getConfig().then(setConfig).catch(() => {});
  }, []);

  return (
    <div className="page page--narrow">
      <SEO
        title="Trust and Safety"
        description="How UNCOVERED protects Faceless Voices submissions, evidence, verification labels, and public safety."
      />
      <section className="page-title">
        <span className="eyebrow">
          <ShieldCheck size={16} />
          Trust and safety
        </span>
        <h1>Protection before publication.</h1>
        <p>
          UNCOVERED is built for personal stories the media missed. Faceless Voices
          exists so people can submit sensitive stories without turning private
          identity into public content.
        </p>
      </section>

      <section className="trust-grid">
        {config.trustPolicies.map((policy) => (
          <article key={policy.id}>
            <LockKeyhole size={24} />
            <h2>{policy.title}</h2>
            <p>{policy.body}</p>
          </article>
        ))}
      </section>

      <section className="story-section">
        <h2>Verification labels</h2>
        <div className="policy-list">
          {Object.entries(config.verificationExplainers || {}).map(([label, body]) => (
            <article key={label}>
              <FileCheck2 size={20} />
              <div>
                <strong>{label.replaceAll("_", " ")}</strong>
                <p>{body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="safety-callout">
        <AlertTriangle size={24} />
        <div>
          <strong>UNCOVERED is not emergency services.</strong>
          <p>
            If someone is in immediate danger, contact local emergency services,
            crisis hotlines, or trusted local support first. Submit when it is safe.
          </p>
        </div>
      </section>
    </div>
  );
}
