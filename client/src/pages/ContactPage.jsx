import { Mail, Send } from "lucide-react";
import { useState } from "react";
import { getErrorMessage, sendContact } from "../api/client.js";

export default function ContactPage() {
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice("");
    setError("");

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await sendContact(payload);
      setNotice(response.message);
      event.currentTarget.reset();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="page page--narrow">
      <section className="page-title">
        <span className="eyebrow">
          <Mail size={16} />
          Contact desk
        </span>
        <h1>Contact UNCOVERED</h1>
        <p>Reach the editorial team for corrections, partnership inquiries, or urgent context.</p>
      </section>

      {notice ? <p className="alert">{notice}</p> : null}
      {error ? <p className="alert alert--danger">{error}</p> : null}

      <form className="submission-form" onSubmit={handleSubmit}>
        <section className="form-section">
          <div className="form-grid">
            <label>
              Name
              <input name="name" />
            </label>
            <label>
              Email
              <input name="email" type="email" />
            </label>
            <label>
              Topic
              <select name="topic" defaultValue="general">
                <option value="general">General</option>
                <option value="correction">Correction</option>
                <option value="partnership">Partnership</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
          </div>
          <label>
            Message
            <textarea name="message" rows={8} required />
          </label>
        </section>
        <button className="button button--accent button--wide" type="submit">
          <Send size={18} />
          Send Message
        </button>
      </form>
    </div>
  );
}
