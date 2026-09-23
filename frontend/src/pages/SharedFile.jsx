import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, Lock, ShieldCheck } from "lucide-react";
import { Brand, Button, Skeleton } from "../components/ui.jsx";
import { FileIcon } from "../components/FileIcon.jsx";
import { formatBytes, formatDateOnly, kindLabel } from "../components/hooks.js";
import { getSharedLink } from "../services/mockApi.js";

// Public page for a shared link. Loads the shared record; shows a friendly
// error when the token is unknown or revoked.
export default function SharedFile() {
  const { token } = useParams();
  const [share, setShare] = useState(null);
  const [state, setState] = useState("loading"); // loading | ready | missing

  useEffect(() => {
    let alive = true;
    getSharedLink(token).then((result) => {
      if (!alive) return;
      if (result) {
        setShare(result);
        setState("ready");
      } else {
        setState("missing");
      }
    });
    return () => {
      alive = false;
    };
  }, [token]);

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
          <p>
            The file may have been unshared, or the link is incorrect. Ask the sender for a fresh link if you still
            need access.
          </p>
          <Link className="btn btn-dark" to="/">
            Go to Lumen Vault
          </Link>
        </div>
      ) : (
        <div className="share-card">
          <FileIcon kind={share.kind} name={share.name} size="lg" />
          <h1>{share.name}</h1>
          <p className="share-meta">
            {kindLabel(share.kind)} · {formatBytes(share.size)} · Shared by {share.owner} on{" "}
            {formatDateOnly(share.createdAt)}
          </p>
          <div className="share-actions">
            <Button size="lg" onClick={() => window.alert("Download would start here (demo)")}>
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
