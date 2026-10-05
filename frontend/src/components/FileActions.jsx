import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Eye, FolderInput, Pencil, Share2, Star, Trash2, ChevronLeft } from "lucide-react";
import { BottomSheet } from "./ui.jsx";
import { FileIcon } from "./FileIcon.jsx";
import { ClayFolder } from "./ClayArt.jsx";
import { formatBytes, formatDate, kindLabel } from "./hooks.js";
import { useLibrary } from "../context/LibraryContext.jsx";
import { downloadFileBlob, messageFromError } from "../services/api.js";

// Action sheet for a file row or card: preview, share, move, rename, star,
// delete. The Move step swaps the list for a folder picker in place.
export default function FileActions({ file, onClose }) {
  const navigate = useNavigate();
  const { toggleStar, trashFiles, pushToast, folders, moveFile } = useLibrary();
  const [downloading, setDownloading] = useState(false);
  const [picking, setPicking] = useState(false);
  const [moving, setMoving] = useState(false);

  // Hook order must stay stable even when no file is selected.
  const targets = useMemo(
    () => [
      { key: "root", name: "My Files", fileCount: null, isRoot: true },
      ...folders.map((folder) => ({ key: folder._id, name: folder.name, fileCount: folder.fileCount ?? 0, isRoot: false })),
    ],
    [folders],
  );

  if (!file) return null;

  const id = file._id;
  const currentFolderId = file.folder?._id ?? file.folder ?? null;

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

  const moveTo = (folderId) => async () => {
    setMoving(true);
    const done = await moveFile(id, folderId);
    setMoving(false);
    if (done) onClose();
  };

  return (
    <BottomSheet open onClose={onClose} title={picking ? "Move to" : "File actions"}>
      <div className="fa-head">
        <FileIcon kind={file.kind} name={file.displayName} size="lg" thumb={file.thumb} />
        <div>
          <b>{file.displayName}</b>
          <small>
            {kindLabel(file.kind)} · {formatBytes(file.size)} · {formatDate(file.updatedAt ?? file.createdAt)}
          </small>
        </div>
      </div>

      {picking ? (
        <>
          <p className="fa-hint">Choose a destination for this file.</p>
          <div className="fa-list move-list">
            {targets.map((target) => {
              const isCurrent = (target.isRoot ? null : target.key) === currentFolderId;
              return (
                <button
                  type="button"
                  key={target.key}
                  className="move-row"
                  disabled={moving || isCurrent}
                  aria-current={isCurrent ? "true" : undefined}
                  onClick={moveTo(target.isRoot ? null : target.key)}
                >
                  {target.isRoot ? (
                    <span className="move-root" aria-hidden="true">
                      ▤
                    </span>
                  ) : (
                    <ClayFolder seed={target.name} size={30} />
                  )}
                  <span className="move-name">
                    <b>{target.name}</b>
                    <small>
                      {target.isRoot
                        ? "Library root"
                        : `${target.fileCount} ${target.fileCount === 1 ? "item" : "items"}`}
                    </small>
                  </span>
                  {isCurrent ? <em className="move-here">Current</em> : null}
                </button>
              );
            })}
          </div>
          <button type="button" className="fa-back" onClick={() => setPicking(false)} disabled={moving}>
            <ChevronLeft size={17} /> Back to actions
          </button>
        </>
      ) : (
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
          <button type="button" onClick={() => setPicking(true)}>
            <FolderInput size={18} /> Move
          </button>
          <button type="button" onClick={closeAnd(() => navigate(`/app/files?rename=${id}`))}>
            <Pencil size={18} /> Rename
          </button>
          <button type="button" className="danger" onClick={closeAnd(() => trashFiles([id]))}>
            <Trash2 size={18} /> Delete
          </button>
        </div>
      )}
    </BottomSheet>
  );
}
