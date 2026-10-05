import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, CircleAlert } from "lucide-react";
import { Brand, Button, Field, PasswordField } from "../components/ui.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { fieldErrorsFrom, messageFromError } from "../services/api.js";

export default function Register() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);

  // Mirror of the backend's rules (8+ chars, one letter, one number) so the
  // user gets the same feedback the server would give — but the server
  // remains the source of truth.
  const rules = {
    length: password.length >= 8,
    letter: /[a-zA-Z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const submit = async (event) => {
    event.preventDefault();
    if (name.trim().length < 2) {
      setError("Tell us your name.");
      return;
    }
    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (!rules.length || !rules.letter || !rules.number) {
      setError("Your password doesn't meet the requirements yet.");
      return;
    }
    setError("");
    setFieldErrors({});
    setBusy(true);
    try {
      await signup({ name: name.trim(), email, password });
      navigate("/app", { replace: true });
    } catch (cause) {
      setError(messageFromError(cause, "We couldn't create the account. Try again in a moment."));
      setFieldErrors(fieldErrorsFrom(cause));
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-panel">
        <Link to="/" className="auth-back">
          <ArrowLeft size={17} /> Back to Lumen Vault
        </Link>
        <div className="auth-card">
          <Brand />
          <h1>Create your account</h1>
          <p className="auth-sub">Free for personal use. No card required.</p>
          {error ? (
            <p className="form-alert" role="alert">
              <CircleAlert size={15} /> {error}
            </p>
          ) : null}
          <form onSubmit={submit} className="stack">
            <Field label="Full name">
              <input
                className="input"
                required
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ada Nakamura"
              />
            </Field>
            <Field label="Email address" error={fieldErrors.email}>
              <input
                className="input"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </Field>
            <PasswordField
              label="Password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              hint="At least 8 characters, with a letter and a number."
            />
            <ul className="pw-checklist" aria-hidden="true">
              <li className={rules.length ? "ok" : ""}>
                <Check size={13} /> 8+ characters
              </li>
              <li className={rules.letter ? "ok" : ""}>
                <Check size={13} /> Contains a letter
              </li>
              <li className={rules.number ? "ok" : ""}>
                <Check size={13} /> Contains a number
              </li>
            </ul>
            <Button type="submit" size="lg" loading={busy} className="btn-block">
              Create account
            </Button>
          </form>
          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
        <p className="auth-legal">
          By creating an account you agree to the <Link to="/about">Terms</Link> and{" "}
          <Link to="/about">Privacy Policy</Link>.
        </p>
      </div>
      <aside className="auth-aside">
        <div className="auth-aside-card">
          <h2>A calm home for your files, in about a minute.</h2>
          <p>
            Upload your first file, star what matters, share a link when you are ready. Everything stays private
            until you decide otherwise.
          </p>
        </div>
      </aside>
    </main>
  );
}
