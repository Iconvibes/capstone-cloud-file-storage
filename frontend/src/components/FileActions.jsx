import { useNavigate } from "react-router-dom";
import { Download, Eye, FolderInput, Pencil, Share2, Star, Trash2 } from "lucide-react";
import { BottomSheet } from "./ui.jsx";
import { FileIcon } from "./FileIcon.jsx";
import { formatBytes, formatDate, kindLabel } from "./hooks.js";
import { useLibrary } from "../context/LibraryContext.jsx";

// Action sheet for a file row or card: preview, share, rename, star, trash.
export default function FileActions({ file, onClose }) {
  const navigate = useNavigate();
  const { toggleStar, trashFiles, pushToast } = useLibrary();
  if (!file) return null;

  const closeAnd = (action) => () => {
    onClose();
    action?.();
  };

  return (
    <BottomSheet open onClose={onClose} title="File actions">
      <div className="fa-head">
        <FileIcon kind={file.kind} name={file.name} size="lg" thumb={file.thumb} />
        <div>
          <b>{file.name}</b>
          <small>
            {kindLabel(file.kind)} · {formatBytes(file.size)} · {formatDate(file.updatedAt)}
          </small>
        </div>
      </div>
      <div className="fa-list">
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
        <button type="button" onClick={closeAnd(() => pushToast({ message: "Download started (demo)" }))}>
          <Download size={18} /> Download
        </button>
        <button type="button" onClick={closeAnd(() => navigate(`/app/files?share=${file.id}`))}>
          <Share2 size={18} /> Share
        </button>
        <button type="button" onClick={closeAnd(() => navigate(`/app/files?rename=${file.id}`))}>
          <Pencil size={18} /> Rename
        </button>
        <button type="button" className="danger" onClick={closeAnd(() => trashFiles([file.id]))}>
          <Trash2 size={18} /> Move to trash
        </button>
      </div>
    </BottomSheet>
  );
}
