import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, CircleAlert } from "lucide-react";
import { Brand, Button, Field, PasswordField } from "../components/ui.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Passwords are at least 6 characters.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await login({ email, password });
      navigate(location.state?.from ?? "/app", { replace: true });
    } catch {
      setError("We couldn't sign you in. Check your details and try again.");
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
          <h1>Welcome back</h1>
          <p className="auth-sub">Sign in to reach your files.</p>
          {error ? (
            <p className="form-alert" role="alert">
              <CircleAlert size={15} /> {error}
            </p>
          ) : null}
          <form onSubmit={submit} className="stack">
            <Field label="Email address">
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
            <PasswordField label="Password" value={password} onChange={setPassword} autoComplete="current-password" />
            <div className="auth-row">
              <Link to="/forgot-password" className="auth-forgot">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" size="lg" loading={busy} className="btn-block">
              Sign in
            </Button>
          </form>
          <p className="auth-switch">
            New to Lumen Vault? <Link to="/register">Create an account</Link>
          </p>
        </div>
        <p className="auth-legal">
          Protected by account verification. By continuing you accept the <Link to="/about">Terms</Link> and{" "}
          <Link to="/about">Privacy Policy</Link>.
        </p>
      </div>
      <aside className="auth-aside">
        <div className="auth-aside-card">
          <h2>Your work, right where you left it.</h2>
          <p>
            Recent files on top, storage at a glance, search that reaches everything. Sign in and pick up exactly
            where you stopped.
          </p>
        </div>
      </aside>
    </main>
  );
}
