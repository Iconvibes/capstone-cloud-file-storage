import { useEffect, useState } from "react";
import { Button, Field, Modal } from "./ui.jsx";
import { useLibrary } from "../context/LibraryContext.jsx";

// Rename modal for a file or a folder — pass `folder` for folders.
export default function RenameModal({ file, folder, onClose }) {
  const { renameFile, renameFolder } = useLibrary();
  const target = folder ?? file;
  const [name, setName] = useState(target?.name ?? target?.displayName ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(target?.name ?? target?.displayName ?? "");
    setError("");
  }, [target]);

  if (!target) return null;

  const submit = async (event) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give it a name.");
      return;
    }
    if (trimmed === (target.name ?? target.displayName)) {
      onClose();
      return;
    }
    setBusy(true);
    const result = folder ? await renameFolder(target._id, trimmed) : await renameFile(target._id, trimmed);
    setBusy(false);
    if (result) onClose();
  };

  return (
    <Modal open={Boolean(target)} onClose={onClose} title={folder ? "Rename folder" : "Rename"}>
      <form onSubmit={submit} className="stack">
        <Field label={folder ? "Folder name" : "File name"} error={error}>
          <input
            className="input"
            value={name}
            autoFocus
            onChange={(event) => {
              setName(event.target.value);
              setError("");
            }}
            aria-label={folder ? "Folder name" : "File name"}
          />
        </Field>
        <div className="modal-actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            Save name
          </Button>
        </div>
      </form>
    </Modal>
  );
}
