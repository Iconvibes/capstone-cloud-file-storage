import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Share2,
  Star,
  MoreHorizontal,
  Play,
  Pause,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { useState } from "react";
import { Button, IconButton } from "./ui.jsx";
import { FileIcon } from "./FileIcon.jsx";
import { formatBytes, formatDateOnly, kindLabel } from "./hooks.js";
import { useLibrary } from "../context/LibraryContext.jsx";

// Full-screen preview route for one file. Renders a realistic preview surface
// per file kind; images use the demo thumbnails.
export default function FilePreview() {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const { rawFiles, folders, toggleStar, pushToast } = useLibrary();
  const file = rawFiles.find((f) => f.id === fileId);
  const [starBusy, setStarBusy] = useState(false);

  if (!file) {
    return (
      <main className="app-page">
        <div className="preview-missing">
          <FileIcon kind="default" size="lg" />
          <h2>File unavailable</h2>
          <p>This file may have been deleted or the link is out of date.</p>
          <Button variant="ghost" onClick={() => navigate("/app/files")}>
            Back to My Files
          </Button>
        </div>
      </main>
    );
  }

  const folder = folders.find((f) => f.id === file.folderId);
  const star = async () => {
    setStarBusy(true);
    await toggleStar(file.id);
    setStarBusy(false);
  };

  return (
    <main className="app-page preview-page">
      <header className="preview-top">
        <IconButton label="Back" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </IconButton>
        <div className="preview-title">
          <b>{file.name}</b>
          <small>
            {kindLabel(file.kind)} · {formatBytes(file.size)} · Modified {formatDateOnly(file.updatedAt)}
            {folder ? ` · ${folder.name}` : ""}
          </small>
        </div>
        <div className="preview-actions">
          <IconButton
            label={file.starred ? "Remove from starred" : "Add to starred"}
            onClick={star}
            disabled={starBusy}
            className={file.starred ? "is-on" : ""}
          >
            <Star size={19} />
          </IconButton>
          <IconButton label="Share" onClick={() => pushToast({ message: "Sharing opens from My Files (demo)" })}>
            <Share2 size={19} />
          </IconButton>
          <IconButton label="Download" onClick={() => pushToast({ message: "Download started (demo)" })}>
            <Download size={19} />
          </IconButton>
          <IconButton label="More actions" className="hide-sm">
            <MoreHorizontal size={19} />
          </IconButton>
        </div>
      </header>

      <div className="preview-stage">
        {file.kind === "image" && file.thumb ? (
          <img className="preview-image" src={file.thumb.replace("/640/440", "/1200/820")} alt={file.name} />
        ) : file.kind === "video" ? (
          <VideoMock name={file.name} />
        ) : file.kind === "audio" ? (
          <AudioMock name={file.name} />
        ) : (
          <DocMock file={file} />
        )}
      </div>

      <aside className="preview-info">
        <h3>Details</h3>
        <dl>
          <div>
            <dt>Type</dt>
            <dd>{kindLabel(file.kind)}</dd>
          </div>
          <div>
            <dt>Size</dt>
            <dd>{formatBytes(file.size)}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>{folder?.name ?? "My Files"}</dd>
          </div>
          <div>
            <dt>Modified</dt>
            <dd>{formatDateOnly(file.updatedAt)}</dd>
          </div>
          <div>
            <dt>Shared</dt>
            <dd>{file.shared ? "Yes — link active" : "Private"}</dd>
          </div>
        </dl>
      </aside>
    </main>
  );
}

// Realistic document/PDF preview surface rendered in CSS.
function DocMock({ file }) {
  return (
    <div className={`doc-preview tone-doc-${file.kind}`}>
      <div className="doc-page">
        <span className="doc-rule w70" />
        <span className="doc-rule w95" />
        <span className="doc-rule w85" />
        <span className="doc-rule gap" />
        <span className="doc-rule w60" />
        <span className="doc-rule w90" />
        <span className="doc-rule w45" />
        {file.kind === "sheet" ? (
          <span className="doc-sheet" aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => (
              <span key={i}>
                <i />
                <i />
                <i />
                <i />
              </span>
            ))}
          </span>
        ) : null}
        {file.kind === "slides" ? (
          <span className="doc-slide-block" aria-hidden="true">
            <i />
            <i />
          </span>
        ) : null}
      </div>
      <p className="doc-caption">
        Preview generated for {kindLabel(file.kind)} files. Download for the full copy.
      </p>
    </div>
  );
}

function VideoMock({ name }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className={`video-preview ${playing ? "is-playing" : ""}`.trim()}>
      <div className="video-surface">
        <button
          type="button"
          className="video-bigplay"
          aria-label={playing ? "Pause preview" : "Play preview"}
          onClick={() => setPlaying((v) => !v)}
        >
          {playing ? <Pause size={26} /> : <Play size={26} />}
        </button>
      </div>
      <div className="video-bar">
        <SkipBack size={16} aria-hidden="true" />
        <button type="button" onClick={() => setPlaying((v) => !v)} aria-label={playing ? "Pause" : "Play"}>
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <SkipForward size={16} aria-hidden="true" />
        <span className="video-track">
          <i style={{ width: playing ? "38%" : "12%" }} />
        </span>
        <span className="video-time">1:12 / 3:04</span>
      </div>
      <p className="doc-caption">{name} — video preview (demo).</p>
    </div>
  );
}

function AudioMock({ name }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="audio-preview">
      <div className="audio-art" aria-hidden="true">
        <svg viewBox="0 0 120 40" width="220" height="74">
          {Array.from({ length: 28 }, (_, i) => {
            const h = 8 + Math.abs(Math.sin(i * 1.7)) * 26;
            return <rect key={i} x={i * 8} y={(40 - h) / 2} width="4" height={h} rx="2" fill="currentColor" />;
          })}
        </svg>
      </div>
      <div className="video-bar">
        <SkipBack size={16} aria-hidden="true" />
        <button type="button" onClick={() => setPlaying((v) => !v)} aria-label={playing ? "Pause" : "Play"}>
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <SkipForward size={16} aria-hidden="true" />
        <span className="video-track">
          <i style={{ width: playing ? "54%" : "8%" }} />
        </span>
        <span className="video-time">0:42 / 2:20</span>
      </div>
      <p className="doc-caption">{name}</p>
    </div>
  );
}
