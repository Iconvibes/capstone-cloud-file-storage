import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, Lock, ShieldCheck, CalendarClock, Compass, RefreshCw } from "lucide-react";
import { Brand, Button, Skeleton } from "../components/ui.jsx";
import { FileIcon } from "../components/FileIcon.jsx";
import { formatBytes, formatDateOnly } from "../components/hooks.js";
import { fetchSharedFile, messageFromError, shareDownloadUrl } from "../services/api.js";
import { kindOf } from "../context/LibraryContext.jsx";

// The backend already separates the two dead-end cases: 410 means the link
// exists but its end date has passed, 404 means it was revoked, the file was
// deleted, or the address is simply wrong. Showing that distinction is what
// stops this page guessing at a reason.
const PROBLEMS = {
  expired: {
    status: "Expired",
    title: "This link has expired",
    lead: "The owner gave this link an end date, and it has passed. Ask them for a fresh one.",
    retryable: false,
  },
  invalid: {
    status: "Unavailable",
    title: "This link isn't available",
    lead: "The owner may have revoked it, or the address may have picked up a typo along the way.",
    retryable: false,
  },
  offline: {
    status: "Offline",
    title: "We couldn't reach the server",
    lead: "Check your connection, then try the link again.",
    retryable: true,
  },
  error: {
    status: "Error",
    title: "Something went wrong",
    lead: "The server didn't return the file. Trying again often clears it.",
    retryable: true,
  },
};

const DEFAULT_PROBLEM = "invalid";

// Public page behind every share link (no login). Loads the shared file's
// details and offers a one-click download straight from the backend.
export default function SharedFile() {
  const { token } = useParams();
  const [share, setShare] = useState(null);
  const [state, setState] = useState("loading"); // loading | ready | missing
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState(DEFAULT_PROBLEM);
  // Bumped on retry so the effect re-runs for a link that failed transiently.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setState("loading");
    setShare(null);
    fetchSharedFile(token)
      .then((record) => {
        if (!alive) return;
        setShare(record);
        setState("ready");
      })
      .catch((cause) => {
        if (!alive) return;
        const status = cause?.response?.status;
        setMessage(messageFromError(cause, "The file may have been unshared, or the link is incorrect."));
        setKind(
          cause?.code === "ERR_NETWORK"
            ? "offline"
            : status === 410
              ? "expired"
              : status === 404
                ? "invalid"
                : "error",
        );
        setState("missing");
      });
    return () => {
      alive = false;
    };
  }, [token, attempt]);

  const fileKind = share ? kindOf({ mimeType: share.mimeType }) : "default";
  const expired = share?.expiresAt && new Date(share.expiresAt).getTime() <= Date.now();
  const problem = PROBLEMS[kind] || PROBLEMS[DEFAULT_PROBLEM];

  return (
    <main className="share-page">
      <header className="share-head">
        <Brand />
        <Link to="/" className="share-home">
          <ArrowLeft size={15} /> lumenvault.app
        </Link>
      </header>

      {state === "loading" ? (
        <div className="share-card share-card-loading" aria-label="Loading shared file">
          <Skeleton variant="tile" />
          <Skeleton variant="title" />
          <Skeleton variant="text" style={{ width: "45%" }} />
          <Skeleton variant="block" />
        </div>
      ) : state === "missing" ? (
        <section className="share-card share-dead">
          <span className="share-dead-art" aria-hidden="true">
            <Lock size={34} />
          </span>

          <p className="share-dead-status">
            <span aria-hidden="true">{problem.status}</span>
            <span className="sr-only">{problem.title}.</span>
          </p>

          <h1>{problem.title}</h1>
          <p className="share-dead-lead">{problem.lead}</p>

          {/* The token is visitor-controlled, so it is rendered as clipped
              text rather than trusted markup — same treatment as the 404's
              requested-path readout. */}
          {token ? (
            <p className="share-dead-token">
              <span className="share-dead-token-label">Link address</span>
              <code title={token}>{token}</code>
            </p>
          ) : null}

          {/* Only worth showing when it carries information the headline
              doesn't: on a revoked or expired link the server repeats the
              status word back at us. */}
          {problem.retryable ? <p className="share-dead-note">{message}</p> : null}

          <div className="share-dead-actions">
            <Link className="btn btn-dark" to="/">
              <Compass size={17} aria-hidden="true" />
              Go to Lumen Vault
            </Link>
            {problem.retryable ? (
              <button type="button" className="btn btn-ghost" onClick={() => setAttempt((n) => n + 1)}>
                <RefreshCw size={16} aria-hidden="true" />
                Try again
              </button>
            ) : null}
          </div>
        </section>
      ) : (
        <div className="share-card">
          <FileIcon kind={fileKind} name={share.displayName} size="lg" />
          <h1>{share.displayName}</h1>
          <p className="share-meta">
            {formatBytes(share.size)} · Shared {formatDateOnly(share.createdAt)}
          </p>
          {share.expiresAt ? (
            <p className="share-expiry">
              <CalendarClock size={14} aria-hidden="true" />
              {expired ? "This link has expired." : `Available until ${new Date(share.expiresAt).toLocaleString()}`}
            </p>
          ) : null}
          <div className="share-actions">
            {/* Public download endpoint — no auth needed, the token in the
                URL is the credential. The browser saves the file under its
                real name via the Content-Disposition header. */}
            <Button size="lg" onClick={() => window.open(shareDownloadUrl(token), "_blank")}>
              <Download size={17} /> Download
            </Button>
          </div>
          <p className="share-trust">
            <ShieldCheck size={14} aria-hidden="true" /> Shared via Lumen Vault — the owner can revoke this link at any
            time.
          </p>
        </div>
      )}
    </main>
  );
}