import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Clock3,
  FolderPlus,
  MoreVertical,
  Pencil,
  Share2,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import TopBar from "../components/TopBar.jsx";
import StorageCard from "../components/StorageCard.jsx";
import { FileIcon } from "../components/FileIcon.jsx";
import {
  EmptyState,
  FileSkeletonRows,
  FolderSkeletonCards,
  Modal,
  RecentSkeletonCards,
  Button,
} from "../components/ui.jsx";
import { ClayFolder, HeroCloudArt } from "../components/ClayArt.jsx";
import FileActions from "../components/FileActions.jsx";
import RenameModal from "../components/RenameModal.jsx";
import { formatBytes, formatDate } from "../components/hooks.js";
import { useLibrary } from "../context/LibraryContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

// Measured height of the four-item folder menu, used to flip it above the
// kebab when there is not enough room underneath.
const FOLDER_MENU_H = 176;

export default function Home() {
  const navigate = useNavigate();
  const {
    loading, error, retry, files, folders,
    setUploadOpen, setUploadFolderId, setNewFolderOpen,
    sharedLinks, loadSharedLinks, removeFolder,
  } = useLibrary();
  const { user } = useAuth();

  const [actionsFile, setActionsFile] = useState(null);
  const [renameFolder, setRenameFolder] = useState(null);
  const [deleteFolder, setDeleteFolder] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [menuFolder, setMenuFolder] = useState(null);

  // Newest uploads first — the backend already returns files newest-first.
  const recentFiles = useMemo(() => files.slice(0, 8), [files]);
  const shownFolders = useMemo(() => folders.slice(0, 8), [folders]);

  useEffect(() => {
    loadSharedLinks();
  }, [loadSharedLinks]);

  // The folder menu is positioned against the viewport, so it has to be
  // dismissed whenever that reference point moves under the user.
  useEffect(() => {
    if (!menuFolder) return undefined;
    const close = () => setMenuFolder(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [menuFolder]);

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const railLinks = useMemo(() => sharedLinks.slice(0, 3), [sharedLinks]);

  const openUpload = (folderId = null) => {
    setUploadFolderId(folderId);
    setUploadOpen(true);
  };

  const confirmDeleteFolder = async () => {
    if (!deleteFolder) return;
    setDeleteBusy(true);
    await removeFolder(deleteFolder._id);
    setDeleteBusy(false);
    setDeleteFolder(null);
  };

  if (error) {
    return (
      <main className="app-page">
        <TopBar title="" />
        <div className="page-pad">
          <div className="error-panel">
            <h2>Couldn't load your library</h2>
            <p>{error}</p>
            <button type="button" className="btn btn-brand" onClick={retry}>
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
      {menuFolder ? (
        <div className="menu-scrim" onClick={() => setMenuFolder(null)} aria-hidden="true" />
      ) : null}
      <div className="page-pad home-pad">
        <div className="home-grid">
          <div className="home-main">
            {/* welcome / hero */}
            <section className="welcome" aria-labelledby="hero-title">
              <div className="welcome-copy">
                <h1 className="hero-title" id="hero-title">
                  <span className="hero-hello">
                    {greeting}, {firstName} <span aria-hidden="true">👋</span>
                  </span>
                  <span className="hero-headline">
                    Your files, anytime,
                    <br />
                    anywhere.
                  </span>
                </h1>
                <p className="hero-sub">
                  Upload, organize and access your files from any device — safe and always within reach.
                </p>
                <div className="hero-cta">
                  <button type="button" className="btn btn-brand btn-lg" onClick={() => openUpload(null)}>
                    <Upload size={18} aria-hidden="true" /> Upload File
                  </button>
                  <button type="button" className="btn btn-ghost btn-lg" onClick={() => setNewFolderOpen(true)}>
                    <FolderPlus size={17} aria-hidden="true" /> New folder
                  </button>
                </div>
              </div>
              <div className="hero-art-wrap" aria-hidden="true">
                <HeroCloudArt />
              </div>
            </section>

            {/* folders */}
            <section className="home-sec sec-folders" aria-labelledby="folders-title">
              <div className="home-sec-head">
                <h2 id="folders-title">My Folders</h2>
                <Link to="/app/files">
                  View all <ChevronRight size={14} aria-hidden="true" />
                </Link>
              </div>
              {loading ? (
                <FolderSkeletonCards />
              ) : shownFolders.length ? (
                <div className="folder-scroller">
                  {shownFolders.map((folder) => (
                    <div className={`clay-folder-card ${menuFolder?.folder._id === folder._id ? "is-menu-open" : ""}`.trim()} key={folder._id}>
                      <button
                        type="button"
                        className="clay-folder-main"
                        onClick={() => navigate(`/app/files/folder/${folder._id}`)}
                        aria-label={`Open folder ${folder.name}`}
                      >
                        <ClayFolder seed={folder.name} size={62} />
                        <b>{folder.name}</b>
                        <small>
                          {folder.fileCount ?? 0} {folder.fileCount === 1 ? "item" : "items"}
                        </small>
                      </button>
                      <button
                        type="button"
                        className="clay-folder-kebab"
                        aria-label={`Actions for ${folder.name}`}
                        aria-haspopup="menu"
                        aria-expanded={menuFolder?.folder._id === folder._id}
                        onClick={(event) => {
                          if (menuFolder?.folder._id === folder._id) {
                            setMenuFolder(null);
                            return;
                          }
                          const rect = event.currentTarget.getBoundingClientRect();
                          const below = rect.bottom + 6;
                          const top =
                            below + FOLDER_MENU_H > window.innerHeight - 8
                              ? Math.max(8, rect.top - FOLDER_MENU_H - 6)
                              : below;
                          setMenuFolder({
                            folder,
                            top,
                            left: Math.max(8, Math.min(rect.right - 196, window.innerWidth - 204)),
                          });
                        }}
                      >
                        <MoreVertical size={17} />
                      </button>
                      {menuFolder?.folder._id === folder._id
                        ? createPortal(
                            // Portalled to <body>: the card animates with a CSS
                            // transform on hover/active, and a transformed
                            // ancestor becomes the containing block for fixed
                            // descendants — which yanked the menu out from under
                            // the cursor mid-click.
                            <div
                              className="menu-pop folder-menu"
                              role="menu"
                              style={{ position: "fixed", top: menuFolder.top, left: menuFolder.left }}
                            >
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setMenuFolder(null);
                                  navigate(`/app/files/folder/${folder._id}`);
                                }}
                              >
                                <ChevronRight size={16} /> Open folder
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setMenuFolder(null);
                                  openUpload(folder._id);
                                }}
                              >
                                <Upload size={16} /> Upload here
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setRenameFolder(folder);
                                  setMenuFolder(null);
                                }}
                              >
                                <Pencil size={16} /> Rename
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                className="danger"
                                onClick={() => {
                                  setDeleteFolder(folder);
                                  setMenuFolder(null);
                                }}
                              >
                                <Trash2 size={16} /> Delete
                              </button>
                            </div>,
                            document.body,
                          )
                        : null}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<FolderPlus size={22} />}
                  title="No folders yet"
                  body="Group related files into folders to keep your library tidy."
                  action={
                    <button type="button" className="btn btn-brand btn-sm" onClick={() => setNewFolderOpen(true)}>
                      <FolderPlus size={15} /> New folder
                    </button>
                  }
                />
              )}
            </section>

            {/* recent files */}
            <section className="home-sec sec-recent" aria-labelledby="recent-title">
              <div className="home-sec-head">
                <h2 id="recent-title">Recent Files</h2>
                <Link to="/app/files?sort=newest">
                  View all <ChevronRight size={14} aria-hidden="true" />
                </Link>
              </div>
              {loading ? (
                <RecentSkeletonCards />
              ) : recentFiles.length ? (
                <div className="recent-cards">
                  {recentFiles.map((file) => (
                    <div className="recent-card" key={file._id}>
                      <button
                        type="button"
                        className="recent-card-main"
                        onClick={() => navigate(`/app/preview/${file._id}`)}
                      >
                        <FileIcon kind={file.kind} name={file.displayName} thumb={file.thumb} />
                        <span className="recent-card-meta">
                          <b>{file.displayName}</b>
                          <small>
                            {formatBytes(file.size)} · {formatDate(file.updatedAt ?? file.createdAt)}
                          </small>
                        </span>
                      </button>
                      <button
                        type="button"
                        className="recent-card-kebab"
                        aria-label={`Actions for ${file.displayName}`}
                        onClick={() => setActionsFile(file)}
                      >
                        <MoreVertical size={17} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Clock3 size={22} />}
                  title="Nothing here yet"
                  body="Files you upload will show up here, newest first."
                  action={
                    <button type="button" className="btn btn-brand btn-sm" onClick={() => openUpload(null)}>
                      <Upload size={15} /> Upload files
                    </button>
                  }
                />
              )}
            </section>
          </div>

          {/* contextual rail: storage, quick actions, shared links */}
          <aside className="home-rail" aria-label="Library overview">
            <StorageCard />

            <section className="rail-card rail-quick" aria-labelledby="quick-title">
              <h3 id="quick-title">Quick Actions</h3>
              <button type="button" className="btn btn-brand btn-block quick-primary" onClick={() => openUpload(null)}>
                <Upload size={17} aria-hidden="true" /> Upload File
              </button>
              <div className="quick-grid">
                <button type="button" className="rail-action" onClick={() => setNewFolderOpen(true)}>
                  <span className="rail-action-ic">
                    <FolderPlus size={17} />
                  </span>
                  New Folder
                </button>
                <button type="button" className="rail-action" onClick={() => navigate("/app/files")}>
                  <span className="rail-action-ic">
                    <Share2 size={17} />
                  </span>
                  Share a file
                </button>
                <Link to="/app/starred" className="rail-action">
                  <span className="rail-action-ic">
                    <Star size={17} />
                  </span>
                  Starred
                </Link>
                <Link to="/app/shared" className="rail-action">
                  <span className="rail-action-ic">
                    <ChevronRight size={17} />
                  </span>
                  Shared
                </Link>
              </div>
            </section>

            <section className="rail-card rail-links" aria-labelledby="links-title">
              <div className="rail-card-head">
                <h3 id="links-title">Shared Links</h3>
                <Link to="/app/shared">View all</Link>
              </div>
              {loading ? (
                <FileSkeletonRows rows={2} />
              ) : railLinks.length ? (
                <ul className="link-list">
                  {railLinks.map((link) => {
                    const file = link.file ?? {};
                    const expired = link.expiresAt && new Date(link.expiresAt).getTime() <= Date.now();
                    return (
                      <li key={link._id}>
                        <FileIcon
                          kind={file.fileType === "image" ? "image" : "default"}
                          name={file.displayName}
                          size="sm"
                        />
                        <span className="link-list-meta">
                          <b>{file.displayName}</b>
                          <small>
                            {link.expiresAt
                              ? expired
                                ? "Expired"
                                : `Expires ${formatDate(link.expiresAt)}`
                              : "No expiry"}
                          </small>
                        </span>
                        <em className={`link-state ${expired ? "is-expired" : "is-live"}`}>
                          {expired ? "Expired" : "Active"}
                        </em>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="rail-empty">
                  No active links yet — open a file's Share action to create one.
                </p>
              )}
            </section>
          </aside>
        </div>
      </div>

      <FileActions file={actionsFile} onClose={() => setActionsFile(null)} />
      {renameFolder ? (
        <RenameModal folder={renameFolder} onClose={() => setRenameFolder(null)} />
      ) : null}
      <Modal open={Boolean(deleteFolder)} onClose={() => setDeleteFolder(null)} title="Delete folder?">
        <p className="confirm-text">
          “{deleteFolder?.name}” will be deleted. The {deleteFolder?.fileCount ?? 0} file
          {deleteFolder?.fileCount === 1 ? "" : "s"} inside are kept and move back to My Files.
        </p>
        <div className="modal-actions">
          <Button variant="ghost" onClick={() => setDeleteFolder(null)}>
            Cancel
          </Button>
          <Button variant="danger" loading={deleteBusy} onClick={confirmDeleteFolder}>
            Delete folder
          </Button>
        </div>
      </Modal>
    </main>
  );
}
