import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Eye, Pencil, Share2, Star, Trash2 } from "lucide-react";
import { BottomSheet } from "./ui.jsx";
import { FileIcon } from "./FileIcon.jsx";
import { formatBytes, formatDate, kindLabel } from "./hooks.js";
import { useLibrary } from "../context/LibraryContext.jsx";
import { downloadFileBlob, messageFromError } from "../services/api.js";

// Action sheet for a file row or card: preview, share, rename, star, delete.
export default function FileActions({ file, onClose }) {
  const navigate = useNavigate();
  const { toggleStar, trashFiles, pushToast } = useLibrary();
  const [downloading, setDownloading] = useState(false);
  if (!file) return null;

  const id = file._id;

  const closeAnd = (action) => () => {
    onClose();
    action?.();
  };

  const download = async () => {
    onClose();
    setDownloading(true);
    try {
      const name = await downloadFileBlob(`/files/${id}/download`, file.displayName);
      pushToast({ message: `Downloaded ${name}` });
    } catch (cause) {
      pushToast({ tone: "error", message: messageFromError(cause, "Download failed. Try again.") });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <BottomSheet open onClose={onClose} title="File actions">
      <div className="fa-head">
        <FileIcon kind={file.kind} name={file.displayName} size="lg" thumb={file.thumb} />
        <div>
          <b>{file.displayName}</b>
          <small>
            {kindLabel(file.kind)} · {formatBytes(file.size)} · {formatDate(file.updatedAt ?? file.createdAt)}
          </small>
        </div>
      </div>
      <div className="fa-list">
        <button type="button" onClick={closeAnd(() => navigate(`/app/preview/${id}`))}>
          <Eye size={18} /> Preview
        </button>
        <button
          type="button"
          onClick={closeAnd(() => toggleStar(id).then(() => pushToast({ message: file.starred ? "Removed from Starred" : "Added to Starred" })))}
        >
          <Star size={18} />
          {file.starred ? "Remove from Starred" : "Add to Starred"}
        </button>
        <button type="button" onClick={download} disabled={downloading}>
          <Download size={18} /> {downloading ? "Downloading…" : "Download"}
        </button>
        <button type="button" onClick={closeAnd(() => navigate(`/app/files?share=${id}`))}>
          <Share2 size={18} /> Share
        </button>
        <button type="button" onClick={closeAnd(() => navigate(`/app/files?rename=${id}`))}>
          <Pencil size={18} /> Rename
        </button>
        <button type="button" className="danger" onClick={closeAnd(() => trashFiles([id]))}>
          <Trash2 size={18} /> Delete
        </button>
      </div>
    </BottomSheet>
  );
}
