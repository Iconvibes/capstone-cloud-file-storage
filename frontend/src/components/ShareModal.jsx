import { useState } from "react";
import { Check, Copy, Link2, Mail } from "lucide-react";
import { Button, Field, Modal } from "./ui.jsx";
import { useLibrary } from "../context/LibraryContext.jsx";

export default function ShareModal({ file, onClose }) {
  const { shareFile, pushToast } = useLibrary();
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("view");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!file) return null;

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    const share = await shareFile(file.id, { email, permission });
    setBusy(false);
    if (share) {
      setResult(share);
      pushToast({ message: `Invite sent to ${email}` });
    }
  };

  const copy = async () => {
    const link = `${window.location.origin}/share/${result.token}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      pushToast({ tone: "error", message: "Copy failed — select the link manually." });
    }
  };

  return (
    <Modal open={Boolean(file)} onClose={onClose} title={`Share “${file.name}”`} width={460}>
      {result ? (
        <div className="stack">
          <p className="share-done-note">
            <Mail size={16} aria-hidden="true" /> {email} has {permission} access.
          </p>
          <Field label="Share link" hint="Anyone with this link can open the file.">
            <div className="input-wrap">
              <span className="input-ic">
                <Link2 size={16} />
              </span>
              <input className="input has-ic" readOnly value={`${window.location.origin}/share/${result.token}`} />
            </div>
          </Field>
          <div className="modal-actions">
            <Button variant="ghost" onClick={copy}>
              {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy link"}
            </Button>
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      ) : (
        <form className="stack" onSubmit={submit}>
          <Field label="Invite by email">
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="teammate@company.com"
            />
          </Field>
          <Field label="Permission">
            <div className="seg" role="radiogroup" aria-label="Permission">
              {[
                { key: "view", label: "Can view" },
                { key: "edit", label: "Can edit" },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  role="radio"
                  aria-checked={permission === option.key}
                  className={permission === option.key ? "is-on" : ""}
                  onClick={() => setPermission(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </Field>
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={busy}>
              Send invite
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
