import { useEffect, useState } from "react";
import { Button, Field, Modal } from "./ui.jsx";
import { useLibrary } from "../context/LibraryContext.jsx";

export default function RenameModal({ file, onClose }) {
  const { renameFile, folders } = useLibrary();
  const [name, setName] = useState(file?.name ?? "");
  const [folderId, setFolderId] = useState(file?.folderId ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(file?.name ?? "");
    setFolderId(file?.folderId ?? "");
    setError("");
  }, [file]);

  if (!file) return null;

  const submit = async (event) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 100) {
      setError("Enter a file name between 1 and 100 characters.");
      return;
    }
    setBusy(true);
    setError("");
    const updated = await renameFile(file.id, trimmed, folderId || null);
    setBusy(false);
    if (updated) onClose();
    else setError("Unable to save these changes. Check the message and try again.");
  };

  return (
    <Modal open={Boolean(file)} onClose={() => !busy && onClose()} title="Rename or move">
      <form onSubmit={submit} className="stack">
        <Field label="File name" error={error}>
          <input className="input" value={name} autoFocus maxLength={100} onChange={(event) => { setName(event.target.value); setError(""); }} aria-label="File name" />
        </Field>
        <Field label="Move to folder">
          <select className="input" value={folderId || ""} onChange={(event) => setFolderId(event.target.value)}>
            <option value="">My Files (no folder)</option>
            {folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
          </select>
        </Field>
        <div className="modal-actions">
          <Button type="button" variant="ghost" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy}>Save changes</Button>
        </div>
      </form>
    </Modal>
  );
}
