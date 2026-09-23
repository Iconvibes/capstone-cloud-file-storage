import { Link } from "react-router-dom";
import { ChevronRight, Share2, Star } from "lucide-react";
import { FileIcon } from "./FileIcon.jsx";
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
          aria-label={selected ? `Deselect ${file.name}` : `Select ${file.name}`}
          onClick={() => onSelect(file.id)}
        >
          {selected ? "✓" : ""}
        </button>
      ) : null}
      <button type="button" className="file-row-main" onClick={() => (selectMode ? onSelect(file.id) : onOpen(file))}>
        <FileIcon kind={file.kind} name={file.name} thumb={file.thumb} />
        <span className="file-row-name">
          <b>{file.name}</b>
          <small>
            {formatBytes(file.size)} · {formatDate(file.updatedAt)}
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
              aria-label={file.starred ? `Remove ${file.name} from starred` : `Add ${file.name} to starred`}
              onClick={() => onToggleStar(file.id)}
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
          <FileIcon kind={file.kind} name={file.name} size="lg" />
        )}
      </span>
      <span className="file-card-name">{file.name}</span>
      <span className="file-card-meta">{formatBytes(file.size)}</span>
    </button>
  );
}

export function FolderCard({ folder, onOpen, onToggleStar }) {
  return (
    <div className="folder-card">
      <button type="button" className="folder-card-main" onClick={() => onOpen(folder)}>
        <span className="folder-glyph" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M3 6.2C3 5 4 4 5.2 4h4.1c.6 0 1.2.25 1.6.7l1.2 1.3h6.7C20 6 21 7 21 8.2v9.6c0 1.2-1 2.2-2.2 2.2H5.2C4 20 3 19 3 17.8Z" />
          </svg>
        </span>
        <span className="folder-card-name">
          <b>{folder.name}</b>
          <small>{folder.fileCount} items</small>
        </span>
        <ChevronRight size={16} aria-hidden="true" />
      </button>
      {onToggleStar ? (
        <button
          type="button"
          className={`star-btn ${folder.starred ? "is-on" : ""}`.trim()}
          aria-label={folder.starred ? `Remove ${folder.name} from starred` : `Add ${folder.name} to starred`}
          onClick={() => onToggleStar(folder.id)}
        >
          <Star size={16} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

// Vertical folder tile used inside grid view.
export function FolderTile({ folder, onOpen }) {
  return (
    <button type="button" className="folder-tile" onClick={() => onOpen(folder)}>
      <span className="folder-tile-ic" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M3 6.2C3 5 4 4 5.2 4h4.1c.6 0 1.2.25 1.6.7l1.2 1.3h6.7C20 6 21 7 21 8.2v9.6c0 1.2-1 2.2-2.2 2.2H5.2C4 20 3 19 3 17.8Z" />
        </svg>
      </span>
      <span className="folder-tile-name">{folder.name}</span>
      <span className="folder-tile-meta">{folder.fileCount} items</span>
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
          <FolderTile key={folder.id} folder={folder} onOpen={onOpenFolder} />
        ))}
        {files.map((file) => (
          <FileCard key={file.id} file={file} onOpen={onOpenFile} />
        ))}
      </div>
    );
  }

  return (
    <div className="lib-list">
      {folders.map((folder) => (
        <FolderCard key={folder.id} folder={folder} onOpen={onOpenFolder} onToggleStar={onToggleFileStar} />
      ))}
      {files.map((file) => (
        <FileListItem
          key={file.id}
          file={file}
          onOpen={onOpenFile}
          onToggleStar={onToggleFileStar}
          selectMode={selectMode}
          selected={selectedIds.includes(file.id)}
          onSelect={onToggleSelect}
          folderName={folderNames[file.folderId]}
        />
      ))}
    </div>
  );
}
