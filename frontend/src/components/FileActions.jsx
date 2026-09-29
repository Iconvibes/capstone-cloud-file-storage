import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Eye, FolderInput, Share2, Star, Trash2 } from "lucide-react";
import { BottomSheet } from "./ui.jsx";
import { FileIcon } from "./FileIcon.jsx";
import { formatBytes, formatDate, kindLabel } from "./hooks.js";
import { useLibrary } from "../context/LibraryContext.jsx";
import { downloadToDevice, friendlyError } from "../services/f2Api";

// File actions used from a file row or card. Share and rename/move use the
// existing page-level modals; download and delete call the API directly.
export default function FileActions({ file, onClose }) {
  const navigate = useNavigate();
  const { toggleStar, trashFiles, pushToast } = useLibrary();
  const [busy, setBusy] = useState(false);
  if (!file) return null;

  const closeAnd = (action) => () => {
    onClose();
    action?.();
  };

  const download = async () => {
    setBusy(true);
    try {
      await downloadToDevice(`/files/${file.id}/download`, file.name);
      pushToast({ message: "Download started" });
      onClose();
    } catch (error) {
      pushToast({ tone: "error", message: friendlyError(error, "Unable to download this file.") });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete “${file.name}”? This cannot be undone.`)) return;
    setBusy(true);
    await trashFiles([file.id]);
    setBusy(false);
    onClose();
  };

  return (
    <BottomSheet open onClose={onClose} title="File actions">
      <div className="fa-head">
        <FileIcon kind={file.kind} name={file.name} size="lg" thumb={file.thumb} />
        <div>
          <b>{file.name}</b>
          <small>
            {kindLabel(file.kind)} {formatBytes(file.size)} {formatDate(file.updatedAt)}
          </small>
        </div>
      </div>
      <div className={`fa-list ${busy ? "is-busy" : ""}`}>
        <button type="button" onClick={closeAnd(() => navigate(`/app/preview/${file.id}`))}>
          <Eye size={18} /> Preview
        </button>
        <button
          type="button"
          onClick={closeAnd(() => toggleStar(file.id).then(() => pushToast({ message: file.starred ? "Removed from Starred" : "Added to Starred" })))}
        >
          <Star size={18} />
          {file.starred ? "Remove from Starred" : "Add to Starred"}
        </button>
        <button type="button" disabled={busy} onClick={download}>
          <Download size={18} /> {busy ? "Preparing download…" : "Download"}
        </button>
        <button type="button" onClick={closeAnd(() => navigate(`/app/files?share=${file.id}`))}>
          <Share2 size={18} /> Share
        </button>
        <button type="button" onClick={closeAnd(() => navigate(`/app/files?rename=${file.id}`))}>
          <FolderInput size={18} /> Rename or move
        </button>
        <button type="button" className="danger" disabled={busy} onClick={remove}>
          <Trash2 size={18} /> {busy ? "Deleting…" : "Delete file"}
        </button>
      </div>
    </BottomSheet>
  );
}
