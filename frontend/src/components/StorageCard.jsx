import { useMemo } from "react";
import { Files } from "lucide-react";
import { useLibrary } from "../context/LibraryContext.jsx";
import { formatBytes } from "./hooks.js";

// Library stats card: how many files you keep and how much space they take.
// This product has no storage cap — no quota bar, no percentage used.
export default function StorageCard() {
  const { files, folders } = useLibrary();

  const { count, totalSize } = useMemo(
    () => ({
      count: files.length,
      totalSize: files.reduce((sum, file) => sum + (file.size ?? 0), 0),
    }),
    [files],
  );

  return (
    <section className="storage-card storage-card-compact" aria-label="Library stats">
      <div className="storage-card-top">
        <div>
          <small>Your library</small>
          <b>
            {count} {count === 1 ? "file" : "files"} <span>· {formatBytes(totalSize)}</span>
          </b>
        </div>
      </div>
      <p className="storage-note">
        Across {folders.length} {folders.length === 1 ? "folder" : "folders"} — no storage limit.
      </p>
      <span className="sr-only">
        <Files size={14} />
      </span>
    </section>
  );
}
