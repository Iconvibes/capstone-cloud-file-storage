import { useEffect, useState } from "react";
import { Check, Copy, Link2, CalendarClock } from "lucide-react";
import { Button, Field, Modal } from "./ui.jsx";
import { useLibrary } from "../context/LibraryContext.jsx";
import { messageFromError, sharedFileUrl } from "../services/api.js";

// Share modal: creates (or re-uses) the file's share link, offers a copyable
// URL, an optional expiry date, and a revoke control — all backed by the
// real /api/files/:id/share endpoints.
export default function ShareModal({ file, onClose }) {
  const { shareFile, revokeShare, pushToast } = useLibrary();
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setResult(null);
    setCopied(false);
  }, [file?._id]);

  if (!file) return null;

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const share = await shareFile(file._id, { expiresAt: expiresAt || null });
      setResult(share);
      pushToast({ message: "Share link ready" });
    } catch (cause) {
      pushToast({ tone: "error", message: messageFromError(cause, "Couldn't create the share link. Try again.") });
    } finally {
      setBusy(false);
    }
  };

  const revoke = async () => {
    setRevoking(true);
    const done = await revokeShare(file._id);
    setRevoking(false);
    if (done) {
      pushToast({ message: "Link revoked — it no longer works" });
      onClose();
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sharedFileUrl(result.token));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      pushToast({ tone: "error", message: "Copy failed — select the link manually." });
    }
  };

  const linkText = result ? sharedFileUrl(result.token) : "";

  return (
    <Modal open={Boolean(file)} onClose={onClose} title={`Share “${file.displayName}”`} width={460}>
      {result ? (
        <div className="stack">
          <Field label="Share link" hint="Anyone with this link can view and download the file — no account needed.">
            <div className="input-wrap">
              <span className="input-ic">
                <Link2 size={16} />
              </span>
              <input className="input has-ic" readOnly value={linkText} />
            </div>
          </Field>
          <p className="share-done-note">
            <CalendarClock size={16} aria-hidden="true" />
            {result.expiresAt ? `Link expires ${new Date(result.expiresAt).toLocaleString()}.` : "This link never expires."}
          </p>
          <div className="modal-actions">
            <Button variant="ghost" onClick={copy}>
              {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy link"}
            </Button>
            <Button variant="danger" onClick={revoke} loading={revoking}>
              Revoke link
            </Button>
          </div>
        </div>
      ) : (
        <form className="stack" onSubmit={submit}>
          <Field label="Link expiry (optional)" hint="Leave empty for a link that never expires.">
            <input
              className="input"
              type="datetime-local"
              value={expiresAt}
              min={new Date().toISOString().slice(0, 16)}
              onChange={(event) => setExpiresAt(event.target.value)}
            />
          </Field>
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={busy}>
              Create share link
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
