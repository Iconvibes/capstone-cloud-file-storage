import { useMemo } from "react";
import { Files, FolderOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useLibrary } from "../context/LibraryContext.jsx";
import { formatBytes } from "./hooks.js";
import { CloudGlyph } from "./ClayArt.jsx";
import { Skeleton } from "./ui.jsx";

// Composition colors for the real file-type buckets — supporting accents only.
const KIND_TONE = {
  image: "var(--brand)",
  pdf: "#e3372b",
  doc: "#2f55d4",
  sheet: "#12955a",
  slides: "#ef7d16",
  video: "#d6247c",
  audio: "#0f9e90",
  archive: "#64708a",
  default: "#93a0b5",
};

// Library stats card: real file count + total size, with a tactile
// composition bar showing what the library is made of.
// This product has no storage cap — no quota bar, no percentage used.
export default function StorageCard() {
  const { files, folders, loading } = useLibrary();

  const { count, totalSize, parts } = useMemo(() => {
    const byKind = new Map();
    let size = 0;
    files.forEach((file) => {
      const bytes = file.size ?? 0;
      size += bytes;
      byKind.set(file.kind, (byKind.get(file.kind) ?? 0) + bytes);
    });
    const top = [...byKind.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([kind, bytes]) => ({ kind, bytes, tone: KIND_TONE[kind] ?? KIND_TONE.default }));
    return { count: files.length, totalSize: size, parts: top };
  }, [files]);

  const topParts = parts.slice(0, 4);

  return (
    <section className="storage-card" aria-label="Library stats">
      <div className="storage-card-top">
        <span className="storage-ic" aria-hidden="true">
          <CloudGlyph size={24} />
        </span>
        <div className="storage-card-head">
          <b>Storage</b>
          {loading ? (
            <small>
              <Skeleton variant="text" style={{ width: "104px" }} />
            </small>
          ) : (
            <small>
              {count} {count === 1 ? "file" : "files"} ·{" "}
              <span className="storage-size">{formatBytes(totalSize)}</span> used
            </small>
          )}
        </div>
        <Link to="/app/files" className="storage-manage" aria-label="Manage your files">
          Manage
        </Link>
      </div>

      {loading ? (
        <div className="sk-block" role="status" aria-label="Loading storage">
          <Skeleton variant="block" className="sk-storage-bar" />
          <div className="storage-legend">
            <Skeleton variant="text" style={{ width: "96px" }} />
            <Skeleton variant="text" style={{ width: "96px" }} />
          </div>
        </div>
      ) : count ? (
        <>
          <div
            className="storage-segbar"
            role="img"
            aria-label={`Composition: ${topParts
              .map((part) => `${part.kind} ${formatBytes(part.bytes)}`)
              .join(", ")}`}
          >
            {parts.map((part) => (
              <i
                key={part.kind}
                style={{
                  background: part.tone,
                  flexGrow: Math.max(part.bytes, 1),
                }}
              />
            ))}
          </div>
          <div className="storage-legend">
            {topParts.map((part) => (
              <span key={part.kind}>
                <i style={{ background: part.tone }} />
                {part.kind} · {formatBytes(part.bytes)}
              </span>
            ))}
          </div>
        </>
      ) : null}

      <p className="storage-note">
        <FolderOpen size={13} aria-hidden="true" />
        {loading ? (
          <Skeleton variant="text" style={{ width: "170px", display: "inline-block" }} />
        ) : (
          <>
            Across {folders.length} {folders.length === 1 ? "folder" : "folders"} — no storage limit.
          </>
        )}
      </p>
      <span className="sr-only">
        <Files size={14} />
      </span>
    </section>
  );
}
