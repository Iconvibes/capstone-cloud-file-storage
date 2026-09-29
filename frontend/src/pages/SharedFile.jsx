import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, Lock, ShieldCheck } from "lucide-react";
import { Brand, Button, Skeleton } from "../components/ui.jsx";
import { FileIcon } from "../components/FileIcon.jsx";
import { formatBytes, formatDateOnly, kindLabel } from "../components/hooks.js";
import api from "../services/api";
import { downloadToDevice, friendlyError, normalizeFile, unwrap } from "../services/f2Api";

export default function SharedFile() {
  const { token } = useParams();
  const [share, setShare] = useState(null);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let alive = true;
    setState("loading");
    setShare(null);
    setError("");
    api.get(`/share/${encodeURIComponent(token)}`)
      .then((response) => {
        if (!alive) return;
        const data = unwrap(response);
        const rawFile = data.file ?? data.sharedFile ?? data;
        if (!(rawFile.displayName || rawFile.originalName || rawFile.name)) {
          setState("missing");
          return;
        }
        const file = normalizeFile(rawFile);
        setShare({ ...data, ...file });
        setState("ready");
      })
      .catch((cause) => {
        if (!alive) return;
        if ([404, 410].includes(cause?.response?.status)) {
          setState("missing");
        } else {
          setError(friendlyError(cause, "Unable to load this shared file. Please try again."));
          setState("error");
        }
      });
    return () => { alive = false; };
  }, [token]);

  const download = async () => {
    setDownloading(true);
    setError("");
    try {
      await downloadToDevice(`/share/${encodeURIComponent(token)}/download`, share.name);
    } catch (cause) {
      setError(friendlyError(cause, "Unable to download this file. Please try again."));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="share-page">
      <header className="share-head">
        <Brand />
        <Link to="/" className="share-home"><ArrowLeft size={15} /> Nimbus</Link>
      </header>

      {state === "loading" ? (
        <div className="share-card share-card-loading" role="status" aria-label="Loading shared file">
          <Skeleton variant="tile" /><Skeleton variant="title" /><Skeleton variant="text" style={{ width: "45%" }} /><Skeleton variant="block" />
        </div>
      ) : state === "missing" ? (
        <div className="share-card">
          <span className="share-missing-ic" aria-hidden="true"><Lock size={24} /></span>
          <h1>This link isn’t available</h1>
          <p>This link is invalid, expired, or has been turned off by its owner.</p>
          <Link className="btn btn-dark" to="/">Go to Nimbus</Link>
        </div>
      ) : state === "error" ? (
        <div className="share-card">
          <span className="share-missing-ic" aria-hidden="true"><Lock size={24} /></span>
          <h1>Unable to load this file</h1>
          <p role="alert">{error}</p>
          <Button variant="ghost" onClick={() => window.location.reload()}>Try again</Button>
        </div>
      ) : (
        <div className="share-card">
          <FileIcon kind={share.kind} name={share.name} size="lg" />
          <h1>{share.name}</h1>
          <p className="share-meta">{kindLabel(share.kind)} · {formatBytes(share.size)}{share.createdAt ? ` · Shared ${formatDateOnly(share.createdAt)}` : ""}</p>
          {error ? <p className="form-alert" role="alert">{error}</p> : null}
          <div className="share-actions">
            <Button size="lg" loading={downloading} onClick={download}><Download size={17} />{downloading ? "Preparing download…" : "Download"}</Button>
          </div>
          <p className="share-trust"><ShieldCheck size={14} aria-hidden="true" /> The owner can turn off this share link at any time.</p>
        </div>
      )}
    </main>
  );
}
