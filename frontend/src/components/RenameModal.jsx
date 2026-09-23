import { useEffect, useState } from "react";
import { Button, Field, Modal } from "./ui.jsx";
import { useLibrary } from "../context/LibraryContext.jsx";

export default function RenameModal({ file, onClose }) {
  const { renameFile } = useLibrary();
  const [name, setName] = useState(file?.name ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(file?.name ?? "");
    setError("");
  }, [file]);

  const submit = async (event) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give the file a name.");
      return;
    }
    if (trimmed === file.name) {
      onClose();
      return;
    }
    setBusy(true);
    await renameFile(file.id, trimmed);
    setBusy(false);
    onClose();
  };

  return (
    <Modal open={Boolean(file)} onClose={onClose} title="Rename">
      <form onSubmit={submit} className="stack">
        <Field label="File name" error={error}>
          <input
            className="input"
            value={name}
            autoFocus
            onChange={(event) => {
              setName(event.target.value);
              setError("");
            }}
            aria-label="File name"
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
