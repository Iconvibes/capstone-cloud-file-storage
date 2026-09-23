import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Field, Modal } from "./ui.jsx";
import { useLibrary } from "../context/LibraryContext.jsx";

// NewFolderModal collects a name and creates the folder in the current parent.
export function NewFolderModal({ open, onClose, parentId = null }) {
  const { createFolder } = useLibrary();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give the folder a name.");
      return;
    }
    setBusy(true);
    const created = await createFolder(trimmed, parentId);
    setBusy(false);
    if (created) {
      setName("");
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New folder">
      <form className="stack" onSubmit={submit}>
        <Field label="Folder name" error={error}>
          <input
            className="input"
            value={name}
            autoFocus
            placeholder="e.g. Website Redesign"
            onChange={(event) => {
              setName(event.target.value);
              setError("");
            }}
          />
        </Field>
        <div className="modal-actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            Create folder
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function Breadcrumb({ trail }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {trail.map((crumb, index) => {
        const last = index === trail.length - 1;
        return (
          <span className="crumb" key={crumb.id ?? crumb.label}>
            {last || !crumb.to ? (
              <span className="crumb-here" aria-current={last ? "page" : undefined}>
                {crumb.label}
              </span>
            ) : (
              <Link to={crumb.to}>{crumb.label}</Link>
            )}
            {!last ? <span className="crumb-sep" aria-hidden="true">/</span> : null}
          </span>
        );
      })}
    </nav>
  );
}
