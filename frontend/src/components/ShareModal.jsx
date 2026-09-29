import { useEffect, useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { Button, Field, Modal } from "./ui.jsx";
import { useLibrary } from "../context/LibraryContext.jsx";
import { friendlyError } from "../services/f2Api";

export default function ShareModal({ file, onClose }) {
  const { shareFile, revokeShare, pushToast } = useLibrary();
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setResult(null);
    setExpiresAt("");
    setError("");
    setNotice("");
  }, [file?.id]);
  if (!file) return null;

  const token = result?.token ?? result?.shareToken;
  const url = result?.url ?? result?.shareUrl ?? (token ? `${window.location.origin}/share/${token}` : "");

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const options = expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {};
      const share = await shareFile(file.id, options);
      if (!share?.token && !share?.shareToken && !share?.url && !share?.shareUrl) {
        throw new Error("The server did not return a share link.");
      }
      setResult(share);
      pushToast({ message: "Share link created" });
    } catch (cause) {
      setError(friendlyError(cause, "Unable to create a share link."));
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copy failed. Select the link and copy it manually.");
    }
  };

  const revoke = async () => {
    setBusy(true);
    setError("");
    try {
      await revokeShare(file.id);
      setResult(null);
      setNotice("The share link has been turned off.");
      pushToast({ message: "Share link revoked" });
    } catch (cause) {
      setError(friendlyError(cause, "Unable to revoke this link."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={Boolean(file)} onClose={onClose} title={`Share “${file.name}”`} width={460}>
      {result && url ? (
        <div className="stack">
          <p className="share-done-note">Anyone with this link can view and download this file.</p>
          <Field label="Share link">
            <div className="input-wrap">
              <span className="input-ic"><Link2 size={16} /></span>
              <input className="input has-ic" readOnly value={url} onFocus={(event) => event.target.select()} />
            </div>
          </Field>
          {notice ? <p className="form-success" role="status">{notice}</p> : null}
          {error ? <p className="form-alert" role="alert">{error}</p> : null}
          <div className="modal-actions">
            <Button variant="ghost" onClick={copy}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Copied" : "Copy link"}</Button>
            <Button variant="danger" loading={busy} onClick={revoke}>Revoke link</Button>
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      ) : (
        <form className="stack" onSubmit={submit}>
          <p className="muted">Create a link for <strong>{file.name}</strong>. You can turn it off at any time.</p>
          <Field label="Link expiry" hint="Optional. Leave blank for a link with no expiry.">
            <input className="input" type="datetime-local" min={new Date(Date.now() + 60000).toISOString().slice(0, 16)} value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
          </Field>
          {notice ? <p className="form-success" role="status">{notice}</p> : null}
          {error ? <p className="form-alert" role="alert">{error}</p> : null}
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={busy}>Create share link</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
