import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, Lock, ShieldCheck, CalendarClock } from "lucide-react";
import { Brand, Button, Skeleton } from "../components/ui.jsx";
import { FileIcon } from "../components/FileIcon.jsx";
import { formatBytes, formatDateOnly } from "../components/hooks.js";
import { fetchSharedFile, messageFromError, shareDownloadUrl } from "../services/api.js";
import { kindOf } from "../context/LibraryContext.jsx";

// Public page behind every share link (no login). Loads the shared file's
// details and offers a one-click download straight from the backend.
export default function SharedFile() {
  const { token } = useParams();
  const [share, setShare] = useState(null);
  const [state, setState] = useState("loading"); // loading | ready | missing
  const [message, setMessage] = useState("");

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
        setMessage(messageFromError(cause, "This link is invalid or has expired."));
        setState("missing");
      });
    return () => {
      alive = false;
    };
  }, [token]);

  const kind = share ? kindOf({ mimeType: share.mimeType }) : "default";
  const expired = share?.expiresAt && new Date(share.expiresAt).getTime() <= Date.now();

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
        <div className="share-card">
          <span className="share-missing-ic" aria-hidden="true">
            <Lock size={24} />
          </span>
          <h1>This link isn't available</h1>
          <p>{message || "The file may have been unshared, or the link is incorrect."}</p>
          <Link className="btn btn-dark" to="/">
            Go to Lumen Vault
          </Link>
        </div>
      ) : (
        <div className="share-card">
          <FileIcon kind={kind} name={share.displayName} size="lg" />
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
