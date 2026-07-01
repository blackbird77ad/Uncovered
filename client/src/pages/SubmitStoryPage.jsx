import {
  AlertTriangle,
  CheckCircle2,
  FileUp,
  LockKeyhole,
  Mic,
  Send,
  ShieldCheck,
  Square,
  UploadCloud,
  UserCircle,
  UserX,
  XCircle
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  clearUserSession,
  getConfig,
  getCurrentUser,
  getErrorMessage,
  getStoredUser,
  getStoredUserToken,
  submitStory
} from "../api/client.js";
import {
  fallbackCategories,
  fallbackIntents,
  fallbackPublishingIdentities,
  fallbackSensitiveFlags
} from "../data/fallbackConfig.js";
import SEO from "../components/SEO.jsx";

export default function SubmitStoryPage() {
  const [config, setConfig] = useState({
    categories: fallbackCategories,
    intents: fallbackIntents,
    sensitiveFlags: fallbackSensitiveFlags,
    publishingIdentities: fallbackPublishingIdentities
  });
  const [userToken, setUserToken] = useState(() => getStoredUserToken());
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [submissionMode, setSubmissionMode] = useState(() =>
    getStoredUserToken() ? "account" : "anonymous_guest"
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [recordingError, setRecordingError] = useState("");
  const [success, setSuccess] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [recording, setRecording] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [evidenceNotes, setEvidenceNotes] = useState({});
  const recorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioStreamRef = useRef(null);

  useEffect(() => {
    getConfig()
      .then((data) =>
        setConfig({
          categories: data.categories || fallbackCategories,
          intents: data.intents || fallbackIntents,
          sensitiveFlags: data.sensitiveFlags || fallbackSensitiveFlags,
          publishingIdentities: data.publishingIdentities || fallbackPublishingIdentities
        })
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!userToken) {
      setCurrentUser(null);
      setSubmissionMode("anonymous_guest");
      return;
    }

    getCurrentUser(userToken)
      .then((user) => {
        setCurrentUser(user);
        setSubmissionMode("account");
      })
      .catch(() => {
        clearUserSession();
        setUserToken("");
        setCurrentUser(null);
        setSubmissionMode("anonymous_guest");
      });
  }, [userToken]);

  useEffect(() => {
    if (!audioFile) {
      setAudioPreviewUrl("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(audioFile);
    setAudioPreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [audioFile]);

  useEffect(() => {
    return () => {
      stopAudioStream();
    };
  }, []);

  function stopAudioStream() {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
  }

  async function startRecording() {
    setRecordingError("");

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setRecordingError("This browser cannot record audio here. You can upload an audio file instead.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const type = recorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type });
        const file = new File([blob], `faceless-voice-${Date.now()}.webm`, { type });
        setAudioFile(file);
        setRecording(false);
        stopAudioStream();
      };

      recorder.start();
      setRecording(true);
    } catch {
      stopAudioStream();
      setRecording(false);
      setRecordingError("Microphone permission was blocked. You can still upload an audio file.");
    }
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  }

  function handleEvidenceChange(event) {
    setEvidenceFiles(Array.from(event.target.files || []).slice(0, 6));
    setEvidenceNotes({});
  }

  function updateEvidenceNote(index, key, value) {
    setEvidenceNotes((current) => ({
      ...current,
      [index]: {
        ...(current[index] || {}),
        [key]: value
      }
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const storyText = String(formData.get("story") || "").trim();

    if (submissionMode === "account" && !currentUser) {
      setSubmitting(false);
      setError("Create an account or sign in before using account submission.");
      return;
    }

    if (!storyText && !audioFile) {
      setSubmitting(false);
      setError("Add a typed story, record audio, or upload an audio file.");
      return;
    }

    formData.set("submissionMode", submissionMode);
    formData.delete("evidencePicker");
    formData.delete("storyAudioUpload");

    if (audioFile) {
      formData.append("storyAudio", audioFile, audioFile.name);
    }

    evidenceFiles.forEach((file, index) => {
      formData.append("evidence", file, file.name);
      formData.append("evidenceDescriptions", evidenceNotes[index]?.description || "");
      formData.append("evidenceSupportsLine", evidenceNotes[index]?.supportsLine || "");
    });

    try {
      const response = await submitStory(
        formData,
        submissionMode === "account" ? userToken : ""
      );
      setSuccess(response.story);
      form.reset();
      setAudioFile(null);
      setEvidenceFiles([]);
      setEvidenceNotes({});
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page page--narrow">
      <SEO
        title="Submit to Faceless Voices"
        description="Submit a protected story to UNCOVERED as an account holder or anonymous guest, with typed text, audio, and private evidence notes."
      />
      <section className="page-title">
        <span className="eyebrow">
          <ShieldCheck size={16} />
          Faceless Voices intake
        </span>
        <h1>Submit Story</h1>
        <p>
          Share a warning, lived experience, personal story, or public-interest
          account. First-time submitters are encouraged to create an account so
          they can return later, add missing points, and submit more stories.
          You can still publish anonymously while signed in, or use the
          userless anonymous route when leaving no account trace matters most.
          Tips or intel still come through as story submissions; the editorial
          team decides the safest next step and public format.
        </p>
      </section>

      <ol className="submission-steps" aria-label="Submission steps">
        <li>Access</li>
        <li>Identity</li>
        <li>Story</li>
        <li>Audio</li>
        <li>Evidence</li>
        <li>Consent</li>
      </ol>

      <section className="faceless-intake">
        <LockKeyhole size={24} />
        <div>
          <strong>Faceless Voices protects public identity by default.</strong>
          <p>
            Anonymous guest submissions are accepted without signup, but they
            cannot be added-up later because no account is attached.
          </p>
        </div>
      </section>

      {["Need Help ASAP", "Mental Health", "Crime", "Missing Person"].includes(selectedCategory) ? (
        <section className="safety-callout">
          <AlertTriangle size={24} />
          <div>
            <strong>Submit when it is safe.</strong>
            <p>
              UNCOVERED is not emergency services. If someone is in immediate
              danger, contact local emergency services or trusted local support first.
            </p>
          </div>
        </section>
      ) : null}

      {success ? (
        <section className="success-panel">
          <CheckCircle2 size={34} />
          <div>
            <h2>Story received</h2>
            <p>
              Your Story ID is <strong>{success.storyId}</strong>.{" "}
              {success.acceptsAuthorAddUps
                ? "Sign in later with this account to add missing points or clarifications."
                : "This was submitted without an account, so it cannot receive account add-ups later."}
            </p>
            <Link className="button button--dark" to="/stories">
              Browse Stories
            </Link>
          </div>
        </section>
      ) : null}

      {error ? <p className="alert alert--danger">{error}</p> : null}

      <form className="submission-form" onSubmit={handleSubmit}>
        <section className="form-section">
          <h2>1. Account access</h2>
          <div className="segmented-grid segmented-grid--identity">
            <label>
              <input
                type="radio"
                name="submissionModeChoice"
                value="account"
                checked={submissionMode === "account"}
                disabled={!currentUser}
                onChange={() => setSubmissionMode("account")}
              />
              <span className="choice-copy">
                <span className="choice-copy__title">
                  <UserCircle size={18} />
                  Account submission
                </span>
                <small>Recommended for first-time submitters</small>
              </span>
            </label>
            <label className="segmented-grid__faceless">
              <input
                type="radio"
                name="submissionModeChoice"
                value="anonymous_guest"
                checked={submissionMode === "anonymous_guest"}
                onChange={() => setSubmissionMode("anonymous_guest")}
              />
              <span className="choice-copy">
                <span className="choice-copy__title">
                  <UserX size={18} />
                  Anonymous guest
                </span>
                <small>No account, no later add-ups</small>
              </span>
            </label>
          </div>

          {currentUser ? (
            <div className="account-hint">
              <strong>Signed in as {currentUser.displayName || currentUser.email}</strong>
              <span>{currentUser.email} / {currentUser.phone}</span>
            </div>
          ) : (
            <div className="account-hint account-hint--warning">
              <strong>Create an account first if you can.</strong>
              <span>
                <Link to="/account">Sign up or log in</Link> to keep access to
                your Story ID, add missing points later, and submit more stories.
                You can still choose anonymous publishing after signing in.
              </span>
            </div>
          )}

          {submissionMode === "anonymous_guest" ? (
            <div className="anonymous-warning">
              <AlertTriangle size={20} />
              <p>
                Guest anonymous means no account is linked. That protects users
                who do not want a signup trace, but it also means the original
                story cannot be edited or added-up later through your account.
              </p>
            </div>
          ) : null}
        </section>

        <section className="form-section">
          <h2>2. Identity and publishing</h2>
          <div className="segmented-grid">
            <label className="segmented-grid__faceless">
              <input type="radio" name="submissionType" value="anonymous" defaultChecked />
              <span className="choice-copy">
                <span className="choice-copy__title">Faceless Voices anonymous</span>
                <small>Public identity protected by editorial review</small>
              </span>
            </label>
            <label>
              <input type="radio" name="submissionType" value="public" />
              <span className="choice-copy">
                <span className="choice-copy__title">Public story</span>
                <small>Use the selected public name preference</small>
              </span>
            </label>
          </div>

          <div className="signup-nudge">
            <ShieldCheck size={20} />
            <p>
              Signed-in users can still submit through Faceless Voices. Choose
              anonymous publishing and tell us what names, identity details, or
              locations need protection in the post; the editorial team handles
              the public version securely during review.
            </p>
          </div>

          <div className="form-grid">
            <label>
              Publishing preference
              <select name="publishingPreference" defaultValue="anonymous">
                {config.publishingIdentities.map((identity) => (
                  <option key={identity} value={identity}>
                    {identity.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            {submissionMode === "account" ? (
              <label>
                Account username
                <input
                  name="accountUsername"
                  defaultValue={currentUser?.username || ""}
                  placeholder="Only if you want username credit"
                />
              </label>
            ) : null}
            <label>
              Display name
              <input name="displayName" placeholder="Anonymous, username, first name, or surname" />
            </label>
          </div>
        </section>

        <section className="form-section">
          <h2>3. Story details</h2>
          <div className="form-grid">
            <label>
              Title
              <input name="title" required maxLength={120} />
            </label>
            <label>
              Category
              <select
                name="category"
                required
                defaultValue=""
                onChange={(event) => setSelectedCategory(event.target.value)}
              >
                <option value="" disabled>
                  Choose category
                </option>
                {config.categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Intent
              <select name="intent" required defaultValue="">
                <option value="" disabled>
                  Choose intent
                </option>
                {config.intents.map((intent) => (
                  <option key={intent} value={intent}>
                    {intent}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Urgency
              <select name="urgency" defaultValue="normal">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="asap">ASAP</option>
              </select>
            </label>
          </div>

          <label>
            Typed story
            <textarea
              name="story"
              minLength={audioFile ? undefined : 40}
              rows={9}
              placeholder="Type the story here, or use audio below. You can also do both."
            />
          </label>

          <div className="form-grid">
            <label>
              Country
              <input name="country" required />
            </label>
            <label>
              Region or city
              <input name="regionCity" />
            </label>
            <label>
              When it happened
              <input name="happenedAt" placeholder="Date, month, or timeframe" />
            </label>
          </div>
        </section>

        <section className="form-section">
          <h2>4. Audio story</h2>
          <div className="audio-recorder">
            <div>
              <strong>Record or upload audio</strong>
              <p>
                For anonymous guest submissions, typed stories are safer because
                audio can reveal your voice. Use audio only if that risk is okay with you.
              </p>
            </div>
            <div className="audio-recorder__actions">
              {recording ? (
                <button className="button button--accent" type="button" onClick={stopRecording}>
                  <Square size={17} />
                  Stop
                </button>
              ) : (
                <button className="button button--dark" type="button" onClick={startRecording}>
                  <Mic size={17} />
                  Record
                </button>
              )}
              {audioFile ? (
                <button className="button button--ghost" type="button" onClick={() => setAudioFile(null)}>
                  <XCircle size={17} />
                  Remove
                </button>
              ) : null}
            </div>
          </div>

          <label className="upload-drop">
            <UploadCloud size={24} />
            <span>Upload an audio file instead</span>
            <input
              name="storyAudioUpload"
              type="file"
              accept="audio/*"
              onChange={(event) => setAudioFile(event.target.files?.[0] || null)}
            />
          </label>

          {recordingError ? <p className="alert alert--danger">{recordingError}</p> : null}
          {audioPreviewUrl ? (
            <div className="audio-preview">
              <strong>{audioFile?.name}</strong>
              <audio className="audio-player" controls src={audioPreviewUrl}>
                <track kind="captions" />
              </audio>
            </div>
          ) : null}
        </section>

        <section className="form-section">
          <h2>5. Sensitive content</h2>
          <div className="checkbox-grid">
            {config.sensitiveFlags.map((flag) => (
              <label key={flag}>
                <input type="checkbox" name="sensitiveFlags" value={flag} />
                <span>{flag}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="form-section">
          <h2>6. Evidence and details</h2>
          <label className="upload-drop">
            <FileUp size={24} />
            <span>Upload documents, images, audio, or video</span>
            <input
              name="evidencePicker"
              type="file"
              multiple
              onChange={handleEvidenceChange}
            />
          </label>

          {evidenceFiles.length ? (
            <div className="evidence-note-list">
              {evidenceFiles.map((file, index) => (
                <article key={`${file.name}-${index}`}>
                  <strong>{file.name}</strong>
                  <label>
                    What does this support?
                    <input
                      value={evidenceNotes[index]?.supportsLine || ""}
                      onChange={(event) =>
                        updateEvidenceNote(index, "supportsLine", event.target.value)
                      }
                      placeholder="Line, phrase, date, or claim this file supports"
                    />
                  </label>
                  <label>
                    Evidence note
                    <textarea
                      value={evidenceNotes[index]?.description || ""}
                      onChange={(event) =>
                        updateEvidenceNote(index, "description", event.target.value)
                      }
                      rows={3}
                      placeholder="Describe what we should notice in this file"
                    />
                  </label>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <section className="form-section">
          <h2>7. Contact</h2>
          {submissionMode === "account" ? (
            <div className="account-hint">
              <strong>We will use your account contact privately.</strong>
              <span>{currentUser?.email} / {currentUser?.phone}</span>
            </div>
          ) : (
            <>
              <div className="anonymous-warning">
                <AlertTriangle size={20} />
                <p>
                  Leave these blank for a userless anonymous submission. Add
                  contact only if you want the editorial team to reach you,
                  understanding that contact details create a private trace.
                </p>
              </div>
              <div className="form-grid">
                <label>
                  Contact name
                  <input name="contactName" />
                </label>
                <label>
                  Email
                  <input name="email" type="email" />
                </label>
                <label>
                  Phone
                  <input name="phone" />
                </label>
                <label>
                  WhatsApp
                  <input name="whatsapp" />
                </label>
              </div>
            </>
          )}

          <label>
            Preferred contact
            <select name="preferredContact" defaultValue="email">
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </label>
        </section>

        <section className="form-section">
          <h2>8. Consent and review</h2>
          <div className="consent-list">
            <label>
              <input name="consentTerms" type="checkbox" required />
              <span>I confirm this submission is truthful to the best of my knowledge.</span>
            </label>
            <label>
              <input name="consentPublish" type="checkbox" required />
              <span>I allow UNCOVERED to review and publish a moderated public version.</span>
            </label>
            <label>
              <input name="consentContact" type="checkbox" />
              <span>I allow the editorial team to contact me for verification if contact exists.</span>
            </label>
            <label>
              <input name="consentSensitive" type="checkbox" />
              <span>I understand sensitive details may be redacted for safety.</span>
            </label>
          </div>
        </section>

        <button className="button button--accent button--wide" type="submit" disabled={submitting}>
          <Send size={18} />
          {submitting ? "Submitting..." : "Submit Story"}
        </button>
      </form>
    </div>
  );
}
