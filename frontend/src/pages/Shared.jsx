import { useNavigate } from "react-router-dom";
import { Link2, Users } from "lucide-react";
import TopBar from "../components/TopBar.jsx";
import { Avatar, EmptyState, FileSkeletonRows } from "../components/ui.jsx";
import { FileIcon } from "../components/FileIcon.jsx";
import { formatBytes, formatDate } from "../components/hooks.js";
import { useLibrary } from "../context/LibraryContext.jsx";

export default function Shared() {
  const navigate = useNavigate();
  const { loading, error, retry, sharedWithMe } = useLibrary();

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
          <h1>Shared with you</h1>
          <p>Files other people have sent into your workspace.</p>
        </header>
        {loading ? (
          <FileSkeletonRows rows={4} />
        ) : sharedWithMe.length === 0 ? (
          <EmptyState
            icon={<Users size={22} />}
            title="Nothing shared with you yet"
            body="When someone shares a file with your email, it appears here."
          />
        ) : (
          <div className="lib-list">
            {sharedWithMe.map((item) => (
              <div className="file-row" key={item.id}>
                <button
                  type="button"
                  className="file-row-main"
                  onClick={() => navigate(`/share/${item.fileId ?? item.id}`)}
                >
                  <FileIcon kind={item.kind} name={item.name} />
                  <span className="file-row-name">
                    <b>{item.name}</b>
                    <small>
                      {formatBytes(item.size)} · {formatDate(item.at)}
                    </small>
                  </span>
                </button>
                <div className="file-row-side">
                  <span className="shared-from">
                    <Avatar name={item.from} size="xs" />
                    <span>
                      {item.from} · {item.permission === "edit" ? "Can edit" : "Can view"}
                    </span>
                  </span>
                  <span className="chip chip-shared" title="Shared with you">
                    <Link2 size={13} aria-hidden="true" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
