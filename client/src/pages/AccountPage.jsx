import { LogIn, LogOut, ShieldCheck, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import {
  clearUserSession,
  getCurrentUser,
  getErrorMessage,
  getStoredUser,
  getStoredUserToken,
  loginUser,
  signupUser
} from "../api/client.js";
import SEO from "../components/SEO.jsx";

export default function AccountPage() {
  const [mode, setMode] = useState("signup");
  const [token, setToken] = useState(() => getStoredUserToken());
  const [user, setUser] = useState(() => getStoredUser());
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    getCurrentUser(token)
      .then((profile) => {
        setUser(profile);
        setError("");
      })
      .catch(() => {
        clearUserSession();
        setToken("");
        setUser(null);
      });
  }, [token]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = mode === "signup" ? await signupUser(payload) : await loginUser(payload);
      setToken(response.token);
      setUser(response.user);
      setNotice(mode === "signup" ? "Account created. You can submit with follow-up access now." : "Signed in. Your account submissions can receive add-ups later.");
      event.currentTarget.reset();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearUserSession();
    setToken("");
    setUser(null);
    setNotice("Signed out.");
  }

  return (
    <div className="page page--narrow">
      <SEO
        title="Account"
        description="Create or access an UNCOVERED account for story submissions that can receive later add-ups."
      />
      <section className="page-title">
        <span className="eyebrow">
          <ShieldCheck size={16} />
          Submit with follow-up access
        </span>
        <h1>Account</h1>
        <p>
          Use an account when you want to return later, add missing points to
          your own story, or submit more stories under the same private profile.
          The anonymous guest route remains available on the submit page.
        </p>
      </section>

      {notice ? <p className="alert">{notice}</p> : null}
      {error ? <p className="alert alert--danger">{error}</p> : null}

      {user ? (
        <section className="account-panel">
          <div>
            <span className="eyebrow">Signed in</span>
            <h2>{user.displayName || user.username || user.email}</h2>
            <p>{user.email}</p>
            <p>{user.phone}</p>
          </div>
          <button className="button button--ghost" type="button" onClick={handleLogout}>
            <LogOut size={17} />
            Sign Out
          </button>
        </section>
      ) : null}

      <section className="auth-panel">
        <div className="auth-tabs" role="tablist" aria-label="Account options">
          <button
            type="button"
            className={mode === "signup" ? "is-active" : ""}
            onClick={() => setMode("signup")}
          >
            <UserPlus size={17} />
            Sign Up
          </button>
          <button
            type="button"
            className={mode === "login" ? "is-active" : ""}
            onClick={() => setMode("login")}
          >
            <LogIn size={17} />
            Log In
          </button>
        </div>

        <form className="account-form" onSubmit={handleSubmit}>
          {mode === "signup" ? (
            <>
              <label>
                Display name
                <input name="displayName" placeholder="Optional public or private name" />
              </label>
              <label>
                Username
                <input name="username" placeholder="Optional username" />
              </label>
            </>
          ) : null}

          <label>
            Email
            <input name="email" type="email" required />
          </label>

          {mode === "signup" ? (
            <label>
              Phone number
              <input name="phone" type="tel" required />
            </label>
          ) : null}

          <label>
            Password
            <input name="password" type="password" minLength={8} required />
          </label>

          <button className="button button--accent button--wide" type="submit" disabled={loading}>
            {mode === "signup" ? <UserPlus size={17} /> : <LogIn size={17} />}
            {loading ? "Please wait..." : mode === "signup" ? "Create Account" : "Log In"}
          </button>
        </form>
      </section>
    </div>
  );
}
