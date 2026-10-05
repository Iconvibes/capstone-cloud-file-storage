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
import { useEffect, useState } from "react";
import { Button, IconButton, Skeleton } from "./ui.jsx";
import { FileIcon } from "./FileIcon.jsx";
import { formatBytes, formatDateOnly, kindLabel } from "./hooks.js";
import { useLibrary, kindOf } from "../context/LibraryContext.jsx";
import { api, downloadFileBlob, fetchFile, messageFromError } from "../services/api.js";

// Full-screen preview route for one file. The file's live details are fetched
// from the backend; images render their real cloud-stored bytes, other kinds
// show a styled placeholder card.
export default function FilePreview() {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const { rawFiles, folders, toggleStar, pushToast, loading: libraryLoading } = useLibrary();
  const [file, setFile] = useState(null);
  const [detailError, setDetailError] = useState("");
  const [imageUrl, setImageUrl] = useState(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [starBusy, setStarBusy] = useState(false);

  const cached = rawFiles.find((f) => f._id === fileId);

  // Detail refresh: reuse the cached copy instantly, then confirm with the
  // backend (a stale list, e.g. after a rename in another tab, corrects here).
  useEffect(() => {
    let alive = true;
    setDetailError("");
    fetchFile(fileId)
      .then((record) => {
        if (alive) setFile(record);
      })
      .catch((cause) => {
        if (alive) setDetailError(messageFromError(cause, "This file may have been deleted or the link is out of date."));
      });
    return () => {
      alive = false;
    };
  }, [fileId]);

  const kind = file ? kindOf(file) : cached?.kind ?? "default";

  // Real image preview: authorized blob load of the cloud asset (via the
  // backend's download stream, so the JWT stays in the header).
  useEffect(() => {
    if (kind !== "image" || !file?._id) return undefined;
    let objectUrl = null;
    api
      .get(`/files/${file._id}/download`, { responseType: "blob" })
      .then((response) => {
        objectUrl = URL.createObjectURL(response.data);
        setImageUrl(objectUrl);
      })
      .catch(() => setImageFailed(true));
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file?._id, kind]);

  if (detailError) {
    return (
      <main className="app-page preview-page">
        <header className="preview-top">
          <IconButton label="Back" onClick={() => navigate("/app/files")}>
            <ArrowLeft size={20} />
          </IconButton>
          <div className="preview-title">
            <b>File unavailable</b>
          </div>
        </header>
        <div className="preview-missing">
          <FileIcon kind="default" size="lg" />
          <h2>File unavailable</h2>
          <p>{detailError}</p>
          <Button variant="ghost" onClick={() => navigate("/app/files")}>
            Back to My Files
          </Button>
        </div>
      </main>
    );
  }

  if (!file) {
    // Still loading — show skeletons unless the library already failed hard.
    return (
      <main className="app-page preview-page">
        <header className="preview-top">
          <IconButton label="Back" onClick={() => navigate("/app/files")}>
            <ArrowLeft size={20} />
          </IconButton>
          <div className="preview-title">
            <b>Loading preview</b>
          </div>
        </header>
        <div className="preview-missing">
          <Skeleton variant="tile" />
          <Skeleton variant="title" />
          <Skeleton variant="text" style={{ width: "45%" }} />
          {libraryLoading ? null : (
            <Button variant="ghost" onClick={() => navigate("/app/files")}>
              Back to My Files
            </Button>
          )}
        </div>
      </main>
    );
  }

  const folder = folders.find((f) => f._id === (file.folder?._id ?? file.folder));
  const star = async () => {
    setStarBusy(true);
    await toggleStar(file._id);
    setStarBusy(false);
  };

  const download = async () => {
    setDownloading(true);
    try {
      const name = await downloadFileBlob(`/files/${file._id}/download`, file.displayName);
      pushToast({ message: `Downloaded ${name}` });
    } catch (cause) {
      pushToast({ tone: "error", message: messageFromError(cause, "Download failed. Try again.") });
    } finally {
      setDownloading(false);
    }
  };

  const share = () => {
    navigate(`/app/files?share=${file._id}`);
  };

  return (
    <main className="app-page preview-page">
      <header className="preview-top">
        <IconButton label="Back" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </IconButton>
        <div className="preview-title">
          {/* Both lines ellipsis-truncate on narrow screens; title keeps the
              full text reachable. */}
          <b title={file.displayName}>{file.displayName}</b>
          <small
            title={`${kindLabel(kind)} · ${formatBytes(file.size)} · Uploaded ${formatDateOnly(file.updatedAt ?? file.createdAt)}${folder ? ` · ${folder.name}` : ""}`}
          >
            {kindLabel(kind)} · {formatBytes(file.size)} · Uploaded {formatDateOnly(file.updatedAt ?? file.createdAt)}
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
          <IconButton label="Share" onClick={share}>
            <Share2 size={19} />
          </IconButton>
          <IconButton label="Download" onClick={download} disabled={downloading}>
            <Download size={19} />
          </IconButton>
          <IconButton label="More actions" className="hide-sm">
            <MoreHorizontal size={19} />
          </IconButton>
        </div>
      </header>

      <div className="preview-stage">
        {kind === "image" && imageUrl && !imageFailed ? (
          <img className="preview-image" src={imageUrl} alt={file.displayName} />
        ) : kind === "image" ? (
          <div className="doc-preview tone-doc-default">
            <div className="doc-page">
              <FileIcon kind="image" name={file.displayName} size="lg" />
              <p className="doc-caption">
                {imageFailed ? "Preview couldn't be loaded — download to view this image." : "Loading preview…"}
              </p>
            </div>
          </div>
        ) : (
          <DocMock file={file} kind={kind} />
        )}
      </div>

      <aside className="preview-info">
        <h3>Details</h3>
        <dl>
          <div>
            <dt>Type</dt>
            <dd title={kindLabel(kind)}>{kindLabel(kind)}</dd>
          </div>
          <div>
            <dt>Size</dt>
            <dd title={formatBytes(file.size)}>{formatBytes(file.size)}</dd>
          </div>
          <div>
            <dt>Location</dt>
            {/* The value ellipsis-truncates on narrow screens; title keeps the
                full folder name reachable on hover. */}
            <dd title={folder?.name ?? "My Files"}>{folder?.name ?? "My Files"}</dd>
          </div>
          <div>
            <dt>Uploaded</dt>
            <dd title={formatDateOnly(file.updatedAt ?? file.createdAt)}>
              {formatDateOnly(file.updatedAt ?? file.createdAt)}
            </dd>
          </div>
          <div>
            <dt>Starred</dt>
            <dd title={file.starred ? "Yes" : "No"}>{file.starred ? "Yes" : "No"}</dd>
          </div>
        </dl>
      </aside>
    </main>
  );
}

// Stylized preview surface for non-image kinds, labeled with the real kind.
function DocMock({ file, kind }) {
  return (
    <div className={`doc-preview tone-doc-${kind}`}>
      <div className="doc-page">
        <FileIcon kind={kind} name={file.displayName} size="lg" />
        <p className="doc-caption">
          {kindLabel(kind)} preview isn't rendered inline — download to view the full copy.
        </p>
      </div>
    </div>
  );
}
