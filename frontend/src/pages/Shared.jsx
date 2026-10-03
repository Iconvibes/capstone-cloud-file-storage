import { useEffect } from "react";
import { Link2 } from "lucide-react";
import TopBar from "../components/TopBar.jsx";
import { EmptyState, FileSkeletonRows, IconButton } from "../components/ui.jsx";
import { FileIcon } from "../components/FileIcon.jsx";
import { formatBytes, formatDate } from "../components/hooks.js";
import { useLibrary } from "../context/LibraryContext.jsx";
import { sharedFileUrl } from "../services/api.js";

// Lists the signed-in user's own active share links, with copy and quick
// open. Revoking lives in the Share modal (per file).
export default function Shared() {
  const { loading, error, retry, sharedLinks, loadSharedLinks } = useLibrary();

  useEffect(() => {
    loadSharedLinks();
  }, [loadSharedLinks]);

  if (error) {
    return (
      <main className="app-page">
        <TopBar title="" />
        <div className="page-pad">
          <div className="error-panel">
            <h2>Couldn't load shared files</h2>
            <p>{error}</p>
            <button type="button" className="btn btn-dark" onClick={retry}>
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="app-page">
      <TopBar title="" />
      <div className="page-pad">
        <header className="page-head">
          <h1>Shared</h1>
          <p>Links you've created — anyone with one can view and download the file.</p>
        </header>
        {loading ? (
          <FileSkeletonRows rows={4} />
        ) : sharedLinks.length === 0 ? (
          <EmptyState
            icon={<Link2 size={22} />}
            title="No active share links"
            body="Open a file's Share action to create a link you can send to anyone."
          />
        ) : (
          <div className="lib-list">
            {sharedLinks.map((link) => {
              const file = link.file ?? {};
              const expired = link.expiresAt && new Date(link.expiresAt).getTime() <= Date.now();
              return (
                <div className="file-row" key={link._id}>
                  <a className="file-row-main" href={sharedFileUrl(link.token)} target="_blank" rel="noreferrer">
                    <FileIcon kind={file.fileType === "image" ? "image" : "default"} name={file.displayName} />
                    <span className="file-row-name">
                      <b>{file.displayName}</b>
                      <small>
                        {formatBytes(file.size)} · Created {formatDate(link.createdAt)}
                        {link.expiresAt ? (expired ? " · Expired" : ` · Expires ${formatDate(link.expiresAt)}`) : " · Never expires"}
                      </small>
                    </span>
                  </a>
                  <div className="file-row-side">
                    <span className="chip chip-shared" title="Active share link">
                      <Link2 size={13} aria-hidden="true" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
