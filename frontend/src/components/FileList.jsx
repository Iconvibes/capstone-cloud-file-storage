import { Link } from "react-router-dom";
import { ChevronRight, Share2, Star } from "lucide-react";
import { FileIcon } from "./FileIcon.jsx";
import { ClayFolder } from "./ClayArt.jsx";
import { formatBytes, formatDate } from "./hooks.js";

// FileListItem renders one file as a list row; FileCard renders the grid tile.

export function FileListItem({ file, onOpen, onToggleStar, selected, onSelect, selectMode, folderName }) {
  return (
    <div className={`file-row ${selected ? "is-selected" : ""}`.trim()}>
      {selectMode ? (
        <button
          type="button"
          className={`check ${selected ? "is-on" : ""}`.trim()}
          role="checkbox"
          aria-checked={selected}
          aria-label={selected ? `Deselect ${file.displayName}` : `Select ${file.displayName}`}
          onClick={() => onSelect(file._id)}
        >
          {selected ? "✓" : ""}
        </button>
      ) : null}
      <button type="button" className="file-row-main" onClick={() => (selectMode ? onSelect(file._id) : onOpen(file))}>
        <FileIcon kind={file.kind} name={file.displayName} thumb={file.thumb} />
        <span className="file-row-name">
          <b>{file.displayName}</b>
          <small>
            {formatBytes(file.size)} · {formatDate(file.updatedAt ?? file.createdAt)}
            {folderName ? ` · ${folderName}` : ""}
          </small>
        </span>
      </button>
      {!selectMode ? (
        <div className="file-row-side">
          {file.shared ? (
            <span className="chip chip-shared" title="Shared">
              <Share2 size={13} aria-hidden="true" /> Shared
            </span>
          ) : null}
          {onToggleStar ? (
            <button
              type="button"
              className={`star-btn ${file.starred ? "is-on" : ""}`.trim()}
              aria-label={file.starred ? `Remove ${file.displayName} from starred` : `Add ${file.displayName} to starred`}
              onClick={() => onToggleStar(file._id)}
            >
              <Star size={17} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function FileCard({ file, onOpen }) {
  return (
    <button type="button" className="file-card" onClick={() => onOpen(file)}>
      <span className="file-card-thumb">
        {file.thumb ? (
          <img src={file.thumb} alt="" loading="lazy" />
        ) : (
          <FileIcon kind={file.kind} name={file.displayName} size="lg" />
        )}
      </span>
      <span className="file-card-name">{file.displayName}</span>
      <span className="file-card-meta">{formatBytes(file.size)}</span>
    </button>
  );
}

export function FolderCard({ folder, onOpen }) {
  return (
    <div className="folder-card">
      <button type="button" className="folder-card-main" onClick={() => onOpen(folder)}>
        <ClayFolder seed={folder.name} size={38} className="folder-glyph" />
        <span className="folder-card-name">
          <b>{folder.name}</b>
          <small>
            {folder.fileCount ?? 0} {folder.fileCount === 1 ? "item" : "items"}
          </small>
        </span>
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

// Vertical folder tile used inside grid view.
export function FolderTile({ folder, onOpen }) {
  return (
    <button type="button" className="folder-tile" onClick={() => onOpen(folder)}>
      <ClayFolder seed={folder.name} size={52} className="folder-tile-ic" />
      <span className="folder-tile-name">{folder.name}</span>
      <span className="folder-tile-meta">
        {folder.fileCount ?? 0} {folder.fileCount === 1 ? "item" : "items"}
      </span>
    </button>
  );
}

export default function FileList({
  folders = [],
  files = [],
  view = "list",
  onOpenFile,
  onOpenFolder,
  onToggleFileStar,
  selectMode = false,
  selectedIds = [],
  onToggleSelect,
  folderNames = {},
  emptyState = null,
}) {
  if (!files.length && !folders.length && emptyState) return emptyState;

  if (view === "grid") {
    return (
      <div className="lib-grid">
        {folders.map((folder) => (
          <FolderTile key={folder._id} folder={folder} onOpen={onOpenFolder} />
        ))}
        {files.map((file) => (
          <FileCard key={file._id} file={file} onOpen={onOpenFile} />
        ))}
      </div>
    );
  }

  return (
    <div className="lib-list">
      {folders.map((folder) => (
        <FolderCard key={folder._id} folder={folder} onOpen={onOpenFolder} />
      ))}
      {files.map((file) => (
        <FileListItem
          key={file._id}
          file={file}
          onOpen={onOpenFile}
          onToggleStar={onToggleFileStar}
          selectMode={selectMode}
          selected={selectedIds.includes(file._id)}
          onSelect={onToggleSelect}
          folderName={folderNames[file.folder?._id ?? file.folder]}
        />
      ))}
    </div>
  );
}
