import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Clock3, FolderPlus, Folder as FolderIcon, Search, Share2, Star, Upload } from "lucide-react";
import TopBar from "../components/TopBar.jsx";
import StorageCard from "../components/StorageCard.jsx";
import { FileIcon } from "../components/FileIcon.jsx";
import { FileSkeletonRows, EmptyState } from "../components/ui.jsx";
import { formatBytes, formatDate } from "../components/hooks.js";
import { useLibrary } from "../context/LibraryContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Home() {
  const navigate = useNavigate();
  const { loading, error, retry, files, folders, setUploadOpen, setNewFolderOpen } = useLibrary();
  const { user } = useAuth();

  // Newest uploads first — the backend already returns files newest-first.
  const recentFiles = useMemo(() => files.slice(0, 6), [files]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  if (error) {
    return (
      <main className="app-page">
        <TopBar title="Home" />
        <div className="page-pad">
          <div className="error-panel">
            <h2>Couldn't load your library</h2>
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
      <TopBar
        title=""
        right={
          <Link to="/app/starred" className="topbar-star-link" aria-label="Starred files">
            <Star size={19} />
          </Link>
        }
      />
      <div className="page-pad">
        <header className="greet">
          <h1>
            {greeting}, {user?.name?.split(" ")[0] ?? "there"}
          </h1>
          <p>Everything you need, right where you left it.</p>
        </header>

        <div className="home-search" onClick={() => navigate("/app/files?focus=search")}>
          <Search size={18} aria-hidden="true" />
          <span>Search files</span>
        </div>

        <StorageCard compact />

        <div className="quick-row">
          <button type="button" onClick={() => setUploadOpen(true)}>
            <span className="quick-ic quick-brand">
              <Upload size={19} />
            </span>
            Upload
          </button>
          <button type="button" onClick={() => setNewFolderOpen(true)}>
            <span className="quick-ic">
              <FolderPlus size={19} />
            </span>
            New folder
          </button>
          <Link to="/app/shared">
            <span className="quick-ic">
              <Share2 size={19} />
            </span>
            Shared
          </Link>
          <Link to="/app/starred">
            <span className="quick-ic">
              <Star size={19} />
            </span>
            Starred
          </Link>
        </div>

        <section className="home-sec">
          <div className="home-sec-head">
            <h2>Recent</h2>
            <Link to="/app/files?sort=newest">See all</Link>
          </div>
          {loading ? (
            <FileSkeletonRows rows={3} />
          ) : recentFiles.length ? (
            <div className="recent-strip">
              {recentFiles.map((file) => (
                <button type="button" className="recent-tile" key={file._id} onClick={() => navigate(`/app/preview/${file._id}`)}>
                  <FileIcon kind={file.kind} name={file.displayName} />
                  <b>{file.displayName}</b>
                  <small>
                    {formatBytes(file.size)} · {formatDate(file.updatedAt ?? file.createdAt)}
                  </small>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Clock3 size={22} />}
              title="Nothing recent yet"
              body="Files you upload will show up here."
            />
          )}
        </section>

        <section className="home-sec">
          <div className="home-sec-head">
            <h2>Folders</h2>
            <Link to="/app/files">See all</Link>
          </div>
          {loading ? (
            <FileSkeletonRows rows={2} />
          ) : (
            <div className="home-folders">
              {folders.slice(0, 4).map((folder) => (
                <Link to={`/app/files/folder/${folder._id}`} className="home-folder" key={folder._id}>
                  <span className="home-folder-ic" aria-hidden="true">
                    <FolderIcon size={18} />
                  </span>
                  <span className="home-folder-meta">
                    <b>{folder.name}</b>
                    <small>{folder.fileCount ?? 0} items</small>
                  </span>
                  <ChevronRight size={16} aria-hidden="true" />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
