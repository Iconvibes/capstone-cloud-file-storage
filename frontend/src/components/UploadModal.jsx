import { useEffect, useRef, useState } from "react";
import { CloudUpload } from "lucide-react";
import { Button, Field, Modal } from "./ui.jsx";
import { FileIcon } from "./FileIcon.jsx";
import { formatBytes } from "./hooks.js";
import { useLibrary } from "../context/LibraryContext.jsx";
import { kindFromName } from "../services/mockApi.js";
import api from "../services/api";
import { friendlyError, normalizeFile, unwrap } from "../services/f2Api";

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = /\.(jpe?g|png|gif|webp|svg|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip)$/i;

export default function UploadModal({ open, onClose, folderId = null }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { upsertFile, pushToast, folders } = useLibrary();
  const [selectedFolderId, setSelectedFolderId] = useState(folderId || "");

  useEffect(() => { if (open) setSelectedFolderId(folderId || ""); }, [open, folderId]);

  if (!open) return null;

  const chooseFile = (candidate) => {
    setError("");
    if (!candidate) return;
    if (candidate.size > MAX_SIZE) {
      setFile(null);
      setError("This file is too large. The maximum size is 10 MB.");
      return;
    }
    if (!ALLOWED_EXTENSIONS.test(candidate.name)) {
      setFile(null);
      setError("This file type is not allowed.");
      return;
    }
    setFile(candidate);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }
    const form = new FormData();
    form.append("file", file);
    if (selectedFolderId) form.append("folderId", selectedFolderId);
    setBusy(true);
    setProgress(0);
    setError("");
    try {
      const response = await api.post("/files/upload", form, {
        onUploadProgress: (event) => event.total && setProgress(Math.round((event.loaded / event.total) * 100)),
      });
      const data = unwrap(response);
      const uploadedFile = normalizeFile(data.file ?? data);
      if (!uploadedFile.id) throw new Error("The server did not return the uploaded file details.");
      upsertFile(uploadedFile);
      pushToast({ message: "File uploaded successfully" });
      setFile(null);
      onClose();
    } catch (cause) {
      setError(friendlyError(cause, "Unable to upload this file. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={() => !busy && onClose()} title="Upload a file" width={500}>
      <form className="stack" onSubmit={submit}>
        <div
          className={`dropzone ${dragging ? "is-dragging" : ""}`.trim()}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files?.[0]); }}
          onClick={(event) => { if (event.target !== inputRef.current) inputRef.current?.click(); }}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && inputRef.current?.click()}
          aria-label="Choose a file or drop it here"
        >
          <input ref={inputRef} type="file" hidden accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip" onChange={(event) => { chooseFile(event.target.files?.[0]); event.target.value = ""; }} />
          {file ? <FileIcon kind={kindFromName(file.name)} name={file.name} size="lg" /> : <span className="dropzone-ic" aria-hidden="true"><CloudUpload size={24} /></span>}
          <b>{file?.name || (dragging ? "Drop your file here" : "Choose a file or drag it here")}</b>
          <small>{file ? formatBytes(file.size) : "Images, PDF, Office documents, text or ZIP · Maximum 10 MB"}</small>
        </div>
        {file ? <Field label="Selected file"><span>{file.name} · {formatBytes(file.size)}</span></Field> : null}
        <Field label="Save to folder">
          <select className="input" value={selectedFolderId} onChange={(event) => setSelectedFolderId(event.target.value)} disabled={busy}>
            <option value="">My Files (no folder)</option>
            {folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
          </select>
        </Field>
        {busy ? <div className="upload-progress-status"><span>Uploading… {progress}%</span><progress value={progress} max="100" aria-label="Upload progress" /></div> : null}
        {error ? <p className="form-alert" role="alert">{error}</p> : null}
        <div className="modal-actions">
          <Button type="button" variant="ghost" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy} disabled={!file}>Upload file</Button>
        </div>
      </form>
    </Modal>
  );
}
