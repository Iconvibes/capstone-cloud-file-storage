import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowUpDown, CheckCheck, FolderOpen, FolderPlus, LayoutGrid, List, Search, Trash2, Upload, X } from "lucide-react";
import TopBar from "../components/TopBar.jsx";
import FileList from "../components/FileList.jsx";
import { EmptyState, FileSkeletonRows, IconButton } from "../components/ui.jsx";
import { Breadcrumb } from "../components/FolderPanel.jsx";
import FileActions from "../components/FileActions.jsx";
import RenameModal from "../components/RenameModal.jsx";
import ShareModal from "../components/ShareModal.jsx";
import { useLibrary } from "../context/LibraryContext.jsx";

const SORTS = [
  { key: "newest", label: "Newest first" },
  { key: "oldest", label: "Oldest first" },
  { key: "name", label: "Name A–Z" },
  { key: "size", label: "Largest first" },
];

export default function Files() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { loading, error, retry, files, folders, sort, setSort, toggleStar, trashFiles, setUploadOpen, setNewFolderOpen } =
    useLibrary();

  const [view, setView] = useState("list");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState([]);
  const [actionsFile, setActionsFile] = useState(null);
  const [sortOpen, setSortOpen] = useState(false);

  const folder = folders.find((f) => f.id === folderId) ?? null;
  const folderNames = useMemo(
    () => Object.fromEntries(folders.map((f) => [f.id, f.name])),
    [folders],
  );

  useEffect(() => {
    if (params.get("focus") === "search") setSearchOpen(true);
  }, [params]);

  // Inside a folder show only its contents; at root show the whole library
  // (files are grouped by their folder chip in the meta line).
  const scopeFiles = useMemo(
    () => (folderId ? files.filter((file) => file.folderId === folderId) : files),
    [files, folderId],
  );
  const scopeFolders = useMemo(
    () => (folderId ? folders.filter((f) => f.parentId === folderId) : folders.filter((f) => !f.parentId)),
    [folders, folderId],
  );

  const visibleFiles = useMemo(() => {
    if (!query.trim()) return scopeFiles;
    const needle = query.toLowerCase();
    return scopeFiles.filter((file) => file.name.toLowerCase().includes(needle));
  }, [scopeFiles, query]);

  const renameTarget = params.get("rename");
  const shareTarget = params.get("share");

  const toggleSelect = (id) =>
    setSelection((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));

  const clearParams = (key) => {
    const next = new URLSearchParams(params);
    next.delete(key);
    setParams(next, { replace: true });
  };

  if (error) {
    return (
      <main className="app-page">
        <TopBar title={folder ? folder.name : "My Files"} />
        <div className="page-pad">
          <div className="error-panel">
            <h2>Couldn't load your files</h2>
            <p>{error}</p>
            <button type="button" className="btn btn-dark" onClick={retry}>
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  const trail = folder
    ? [
        { id: "root", label: "My Files", to: "/app/files" },
        ...(folder.parentId
          ? [
              {
                id: folder.parentId,
                label: folders.find((f) => f.id === folder.parentId)?.name ?? "Folder",
                to: `/app/files/folder/${folder.parentId}`,
              },
            ]
          : []),
        { id: folder.id, label: folder.name },
      ]
    : [{ id: "root", label: "My Files" }];

  return (
    <main className="app-page">
      <TopBar
        title={folder ? folder.name : "My Files"}
        right={
          <div className="topbar-tools">
            <IconButton label="Search files" onClick={() => setSearchOpen((v) => !v)}>
              <Search size={19} />
            </IconButton>
            <IconButton label="Sort" onClick={() => setSortOpen((v) => !v)}>
              <ArrowUpDown size={19} />
            </IconButton>
            <IconButton
              label={view === "list" ? "Switch to grid view" : "Switch to list view"}
              onClick={() => setView((v) => (v === "list" ? "grid" : "list"))}
            >
              {view === "list" ? <LayoutGrid size={19} /> : <List size={19} />}
            </IconButton>
          </div>
        }
      />

      <div className="page-pad">
        <div className="files-toolbar">
          <Breadcrumb trail={trail} />
          <div className="files-actions">
            {scopeFiles.length && !selection.length ? (
              <button
                type="button"
                className="btn btn-soft btn-sm select-enter"
                aria-label="Select files"
                onClick={() => setSelection([scopeFiles[0].id])}
              >
                <CheckCheck size={15} />
              </button>
            ) : null}
            {!selection.length ? (
              <button type="button" className="btn btn-soft btn-sm" onClick={() => setNewFolderOpen(true)}>
                <FolderPlus size={15} /> New folder
              </button>
            ) : null}
            <button type="button" className="btn btn-dark btn-sm" onClick={() => setUploadOpen(true)}>
              <Upload size={15} /> Upload
            </button>
          </div>
        </div>

        {searchOpen ? (
          <div className="searchbar searchbar-lg files-search">
            <Search size={18} aria-hidden="true" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={folder ? `Search in ${folder.name}` : "Search your files"}
              aria-label="Search files"
            />
            <IconButton
              label="Close search"
              onClick={() => {
                setSearchOpen(false);
                setQuery("");
                if (params.get("focus")) clearParams("focus");
              }}
            >
              <X size={15} />
            </IconButton>
          </div>
        ) : null}

        {sortOpen ? (
          <div className="sort-pop" role="menu" aria-label="Sort files">
            {SORTS.map((option) => (
              <button
                key={option.key}
                type="button"
                role="menuitem"
                className={sort === option.key ? "is-on" : ""}
                onClick={() => {
                  setSort(option.key);
                  setSortOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}

        {loading ? (
          <FileSkeletonRows rows={7} />
        ) : (
          <FileList
            folders={scopeFolders}
            files={visibleFiles}
            view={view}
            folderNames={folderNames}
            selectMode={selection.length > 0}
            onOpenFile={(file) => setActionsFile(file)}
            onOpenFolder={(f) => navigate(`/app/files/folder/${f.id}`)}
            onToggleFileStar={(id) => {
              const isFile = files.some((f) => f.id === id);
              if (isFile) toggleStar(id);
            }}
            selectedIds={selection}
            onToggleSelect={toggleSelect}
            emptyState={
              <EmptyState
                icon={<FolderOpen size={22} />}
                title={folder ? "This folder is empty" : query ? "No matching files" : "Your workspace is empty"}
                body={
                  folder
                    ? "Add files to this folder, or create a subfolder to keep things tidy."
                    : query
                      ? "Try a different search — it only looks at file names."
                      : "Upload your first file to get started — everything stays private to you."
                }
                action={
                  query ? (
                    <button type="button" className="btn btn-soft btn-sm" onClick={() => setQuery("")}>
                      Clear search
                    </button>
                  ) : (
                    <button type="button" className="btn btn-dark btn-sm" onClick={() => setUploadOpen(true)}>
                      <Upload size={15} /> Upload files
                    </button>
                  )
                }
              />
            }
          />
        )}
      </div>

      <FileActions file={actionsFile} onClose={() => setActionsFile(null)} />
      {renameTarget ? (
        <RenameModal file={files.find((f) => f.id === renameTarget)} onClose={() => clearParams("rename")} />
      ) : null}
      {shareTarget ? (
        <ShareModal file={files.find((f) => f.id === shareTarget)} onClose={() => clearParams("share")} />
      ) : null}

      {selection.length ? (
        <div className="select-bar">
          <span>{selection.length} selected</span>
          <div>
            <button
              type="button"
              onClick={() => {
                trashFiles(selection);
                setSelection([]);
              }}
            >
              <Trash2 size={15} /> Trash
            </button>
            <button type="button" onClick={() => setSelection([])}>
              <X size={15} /> Clear
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
