import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CircleAlert, MailCheck } from "lucide-react";
import { Brand, Button, Field } from "../components/ui.jsx";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setBusy(true);
    // Mock request — a real integration would call the reset endpoint here.
    await new Promise((resolve) => setTimeout(resolve, 800));
    setBusy(false);
    setSent(true);
  };

  return (
    <main className="auth-page auth-page-solo">
      <div className="auth-panel">
        <Link to="/login" className="auth-back">
          <ArrowLeft size={17} /> Back to sign in
        </Link>
        <div className="auth-card">
          <Brand />
          {sent ? (
            <div className="reset-done">
              <span className="reset-done-ic">
                <MailCheck size={26} />
              </span>
              <h1>Check your inbox</h1>
              <p className="auth-sub">
                If an account exists for <b>{email}</b>, a reset link is on its way. It expires in 30 minutes.
              </p>
              <Button variant="ghost" onClick={() => setSent(false)}>
                Use a different email
              </Button>
            </div>
          ) : (
            <>
              <h1>Reset your password</h1>
              <p className="auth-sub">Enter your email and we will send a reset link.</p>
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
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                </Field>
                <Button type="submit" size="lg" loading={busy} className="btn-block">
                  Send reset link
                </Button>
              </form>
              <p className="auth-switch">
                Remembered it after all? <Link to="/login">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
