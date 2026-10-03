import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowUpDown, CheckCheck, FolderOpen, FolderPlus, LayoutGrid, List, Pencil, Search, Trash2, Upload, X } from "lucide-react";
import TopBar from "../components/TopBar.jsx";
import FileList from "../components/FileList.jsx";
import { Button, EmptyState, FileSkeletonRows, IconButton, Modal } from "../components/ui.jsx";
import { Breadcrumb } from "../components/FolderPanel.jsx";
import FileActions from "../components/FileActions.jsx";
import RenameModal from "../components/RenameModal.jsx";
import ShareModal from "../components/ShareModal.jsx";
import { formatBytes } from "../components/hooks.js";
import { useLibrary } from "../context/LibraryContext.jsx";
import { fetchAllFiles } from "../services/api.js";

const SORTS = [
  { key: "newest", label: "Newest first" },
  { key: "oldest", label: "Oldest first" },
  { key: "name", label: "Name A–Z" },
  { key: "size", label: "Largest first" },
];

// Debounces the search box so typing triggers one server query per pause,
// not one per keystroke.
function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function Files() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const {
    loading, error, retry, files, folders, sort, setSort,
    toggleStar, trashFiles, removeFolder,
    setUploadOpen, setUploadFolderId, setNewFolderOpen,
  } = useLibrary();

  const [view, setView] = useState("list");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selection, setSelection] = useState([]);
  const [actionsFile, setActionsFile] = useState(null);
  const [sortOpen, setSortOpen] = useState(false);
  const [folderPendingDelete, setFolderPendingDelete] = useState(null);
  const [folderBusy, setFolderBusy] = useState(false);

  // Opens the shared upload modal, optionally bound to the open folder.
  const openUpload = () => {
    setUploadFolderId(folder?._id ?? null);
    setUploadOpen(true);
  };

  const debouncedQuery = useDebounced(query);

  // Server-backed search: the debounced term is sent as ?search= and the
  // backend matches it against display names (case-insensitive).
  const [searchResults, setSearchResults] = useState(null);

  useEffect(() => {
    let alive = true;
    if (!debouncedQuery.trim()) {
      setSearchResults(null);
      return undefined;
    }
    fetchAllFiles({ search: debouncedQuery.trim() })
      .then((results) => {
        if (alive) setSearchResults(results.map((file) => file._id));
      })
      .catch(() => {
        if (alive) setSearchResults([]);
      });
    return () => {
      alive = false;
    };
  }, [debouncedQuery]);

  const folder = folders.find((f) => f._id === folderId) ?? null;
  const folderNames = useMemo(
    () => Object.fromEntries(folders.map((f) => [f._id, f.name])),
    [folders],
  );

  useEffect(() => {
    if (params.get("focus") === "search") setSearchOpen(true);
  }, [params]);

  // Subfolders are derived by name: the backend keeps folders flat, and a
  // subfolder is one whose name starts with "Parent/" (created via rename).
  const scopeFolders = useMemo(() => {
    if (!folder) return folders.filter((f) => !(f.name ?? "").includes("/"));
    const prefix = `${folder.name}/`;
    return folders.filter((f) => (f.name ?? "").startsWith(prefix));
  }, [folders, folder]);

  // Inside a folder show only its contents; at root show everything not in a
  // (visible) folder.
  const scopeFiles = useMemo(() => {
    if (folderId) return files.filter((file) => (file.folder?._id ?? file.folder) === folderId);
    const hidden = new Set(scopeFolders.map((f) => f._id));
    return files.filter((file) => {
      const key = file.folder?._id ?? file.folder;
      return !key || !hidden.has(key);
    });
  }, [files, folderId, scopeFolders]);

  const searching = Boolean(debouncedQuery.trim());
  const visibleFiles = useMemo(() => {
    if (searching && searchResults) {
      const ids = new Set(searchResults);
      return files.filter((file) => ids.has(file._id));
    }
    if (typeFilter) return scopeFiles.filter((file) => file.fileType === typeFilter);
    return scopeFiles;
  }, [searching, searchResults, files, typeFilter, scopeFiles]);

  const renameTarget = params.get("rename");
  const shareTarget = params.get("share");
  const folderRenameTarget = params.get("renameFolder");
  const renameFolderObj = folders.find((f) => f._id === folderRenameTarget) ?? null;

  const toggleSelect = (id) =>
    setSelection((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));

  const clearParams = (key) => {
    const next = new URLSearchParams(params);
    next.delete(key);
    setParams(next, { replace: true });
  };

  const confirmDeleteFolder = async () => {
    if (!folderPendingDelete) return;
    setFolderBusy(true);
    const inside = folderPendingDelete._id === folderId;
    const done = await removeFolder(folderPendingDelete._id);
    setFolderBusy(false);
    setFolderPendingDelete(null);
    if (done && inside) navigate("/app/files");
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
        { id: folder._id, label: folder.name },
      ]
    : [{ id: "root", label: "My Files" }];

  const inFolder = Boolean(folder);

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
                onClick={() => setSelection([scopeFiles[0]._id])}
              >
                <CheckCheck size={15} />
              </button>
            ) : null}
            {!selection.length ? (
              <>
                <button type="button" className="btn btn-soft btn-sm" onClick={() => setNewFolderOpen(true)}>
                  <FolderPlus size={15} /> New folder
                </button>
                {inFolder ? (
                  <>
                    <IconButton label={`Rename ${folder.name}`} onClick={() => setParams({ renameFolder: folder._id }, { replace: true })}>
                      <Pencil size={15} />
                    </IconButton>
                    <IconButton label={`Delete ${folder.name}`} onClick={() => setFolderPendingDelete(folder)}>
                      <Trash2 size={15} />
                    </IconButton>
                  </>
                ) : null}
              </>
            ) : null}
            <button type="button" className="btn btn-dark btn-sm" onClick={openUpload}>
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
                setSearchResults(null);
                if (params.get("focus")) clearParams("focus");
              }}
            >
              <X size={15} />
            </IconButton>
          </div>
        ) : null}

        {!searching ? (
          <div className="files-typebar" role="group" aria-label="Filter by type">
            {[
              { key: "", label: "All" },
              { key: "image", label: "Images" },
              { key: "document", label: "Documents" },
              { key: "other", label: "Other" },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                className={typeFilter === option.key ? "is-on" : ""}
                onClick={() => setTypeFilter(option.key)}
              >
                {option.label}
              </button>
            ))}
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
            folders={searching ? [] : scopeFolders}
            files={visibleFiles}
            view={view}
            folderNames={folderNames}
            selectMode={selection.length > 0}
            onOpenFile={(file) => setActionsFile(file)}
            onOpenFolder={(f) => navigate(`/app/files/folder/${f._id}`)}
            onToggleFileStar={(id) => toggleStar(id)}
            selectedIds={selection}
            onToggleSelect={toggleSelect}
            emptyState={
              <EmptyState
                icon={<FolderOpen size={22} />}
                title={
                  searching
                    ? "No matching files"
                    : folder
                      ? "This folder is empty"
                      : "Your workspace is empty"
                }
                body={
                  searching
                    ? `Nothing matches “${debouncedQuery}”. Search covers every file's name.`
                    : folder
                      ? "Add files to this folder to keep things tidy."
                      : "Upload your first file to get started — everything stays private to you."
                }
                action={
                  searching ? (
                    <button type="button" className="btn btn-soft btn-sm" onClick={() => setQuery("")}>
                      Clear search
                    </button>
                  ) : (
                    <button type="button" className="btn btn-dark btn-sm" onClick={openUpload}>
                      <Upload size={15} /> Upload files
                    </button>
                  )
                }
              />
            }
          />
        )}

        {!loading && !searching ? (
          <p className="files-count-note">
            {visibleFiles.length} {visibleFiles.length === 1 ? "file" : "files"}
            {typeFilter ? ` · ${typeFilter}` : ""}
            {scopeFiles.length ? ` · ${formatBytes(scopeFiles.reduce((sum, file) => sum + (file.size ?? 0), 0))} total` : ""}
          </p>
        ) : null}
      </div>

      <FileActions file={actionsFile} onClose={() => setActionsFile(null)} />
      {renameTarget ? (
        <RenameModal file={files.find((f) => f._id === renameTarget)} onClose={() => clearParams("rename")} />
      ) : null}
      {shareTarget ? (
        <ShareModal file={files.find((f) => f._id === shareTarget)} onClose={() => clearParams("share")} />
      ) : null}
      {renameFolderObj ? (
        <RenameModal folder={renameFolderObj} onClose={() => clearParams("renameFolder")} />
      ) : null}

      <Modal open={Boolean(folderPendingDelete)} onClose={() => setFolderPendingDelete(null)} title="Delete folder?">
        <p className="confirm-text">
          “{folderPendingDelete?.name}” will be deleted. The {folderPendingDelete?.fileCount ?? 0} file
          {folderPendingDelete?.fileCount === 1 ? "" : "s"} inside are kept and move back to My Files.
        </p>
        <div className="modal-actions">
          <Button variant="ghost" onClick={() => setFolderPendingDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" loading={folderBusy} onClick={confirmDeleteFolder}>
            Delete folder
          </Button>
        </div>
      </Modal>

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
              <Trash2 size={15} /> Delete
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
