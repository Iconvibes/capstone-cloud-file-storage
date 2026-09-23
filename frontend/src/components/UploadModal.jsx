import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CloudUpload, FileWarning, CheckCircle2, X } from "lucide-react";
import { Button, Modal } from "./ui.jsx";
import { FileIcon } from "./FileIcon.jsx";
import { formatBytes } from "./hooks.js";
import { useLibrary } from "../context/LibraryContext.jsx";
import { kindFromName } from "../services/mockApi.js";

export default function UploadModal({ open, onClose, folderId = null }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState([]);
  const { startUpload, uploads, clearFinishedUploads, cancelUpload } = useLibrary();
  const navigate = useNavigate();

  const activeUploads = uploads.filter((u) => u.status === "uploading");
  const finished = uploads.filter((u) => u.status !== "uploading");

  const addFiles = (fileList) => {
    setPending((current) => {
      const next = [...current];
      [...fileList].forEach((file) => {
        if (!next.some((entry) => entry.name === file.name && entry.size === file.size)) {
          next.push({ name: file.name, size: file.size, kind: kindFromName(file.name) });
        }
      });
      return next;
    });
  };

  const choose = (event) => addFiles(event.target.files);
  const drop = (event) => {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length) addFiles(event.dataTransfer.files);
  };

  const begin = () => {
    if (!pending.length) return;
    // The real integration passes File objects; the mock layer only needs name/size.
    const map = new Map(pending.map((entry) => [entry.name, entry.size]));
    const fakeFileList = [...map].map(([name, size]) => ({ name, size }));
    startUpload(fakeFileList, folderId);
    setPending([]);
  };

  const queueRows = (list) =>
    list.map((entry) => (
      <div className="up-row" key={entry.name}>
        <FileIcon kind={entry.kind} name={entry.name} />
        <div className="up-row-main">
          <b>{entry.name}</b>
          <small>{formatBytes(entry.size)}</small>
          {entry.progress != null ? (
            <span className="up-progress">
              <i style={{ width: `${entry.progress}%` }} />
            </span>
          ) : null}
        </div>
        {entry.status === "uploading" ? (
          <button type="button" className="up-cancel" onClick={() => cancelUpload(entry.id)} aria-label={`Cancel ${entry.name}`}>
            <X size={15} />
          </button>
        ) : entry.status === "done" ? (
          <CheckCircle2 size={18} className="up-ok" aria-hidden="true" />
        ) : entry.status === "failed" ? (
          <FileWarning size={18} className="up-fail" aria-hidden="true" />
        ) : null}
      </div>
    ));

  return (
    <Modal open={open} onClose={onClose} title="Upload files" width={480}>
      <div
        className={`dropzone ${dragging ? "is-dragging" : ""}`.trim()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={drop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={choose}
          aria-label="Choose files to upload"
        />
        <span className="dropzone-ic" aria-hidden="true">
          <CloudUpload size={24} />
        </span>
        <b>Drop files here</b>
        <small>or tap to browse — documents, photos, video, anything you need close.</small>
      </div>

      {pending.length ? (
        <>
          <div className="up-queue">{queueRows(pending)}</div>
          <div className="modal-actions">
            <Button variant="ghost" onClick={() => setPending([])}>
              Clear
            </Button>
            <Button onClick={begin}>Upload {pending.length > 1 ? `${pending.length} files` : "file"}</Button>
          </div>
        </>
      ) : null}

      {activeUploads.length || finished.length ? (
        <div className="up-live">
          <p className="up-live-title">Progress</p>
          {queueRows(activeUploads)}
          {finished.map((entry) => (
            <div className="up-row" key={entry.id}>
              <FileIcon kind={kindFromName(entry.name)} name={entry.name} />
              <div className="up-row-main">
                <b>{entry.name}</b>
                <small>{formatBytes(entry.size)}</small>
              </div>
              {entry.status === "done" ? (
                <CheckCircle2 size={18} className="up-ok" aria-hidden="true" />
              ) : entry.status === "failed" ? (
                <FileWarning size={18} className="up-fail" aria-hidden="true" />
              ) : (
                <span className="up-cancelled">Cancelled</span>
              )}
            </div>
          ))}
          {finished.length ? (
            <button type="button" className="link-btn" onClick={clearFinishedUploads}>
              Clear finished
            </button>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}
