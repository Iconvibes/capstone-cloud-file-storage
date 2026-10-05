import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as cloud from "../services/api.js";

const LibraryContext = createContext(null);

// Mirror of the backend's fileType buckets (uploadController.getFileType).
const MIME_KINDS = [
  [/^image\//, "image"],
  [/^application\/pdf/, "pdf"],
  [/word|officedocument\.wordprocessingml/, "doc"],
  [/excel|spreadsheetml/, "sheet"],
  [/powerpoint|presentationml/, "slides"],
  [/^text\/plain/, "doc"],
  [/^application\/zip$/, "archive"],
];

export function kindOf(file) {
  const mime = file?.mimeType || "";
  for (const [pattern, kind] of MIME_KINDS) {
    if (pattern.test(mime)) return kind;
  }
  return "default";
}

// The workspace keeps every file of the signed-in user in memory and filters
// it per screen; a persisted `starred` flag marks quick-access items.
function withKind(file, starredIds) {
  return {
    ...file,
    kind: kindOf(file),
    starred: starredIds.has(file._id || file.id),
  };
}

export function LibraryProvider({ children }) {
  const [library, setLibrary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState("newest");
  const [toasts, setToasts] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  // Folder the next upload should land in (null = library root).
  const [uploadFolderId, setUploadFolderId] = useState(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  // Own state (not part of `library`): the Shared page can fetch links while
  // the library payload is still loading or absent.
  const [sharedLinks, setSharedLinks] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    ({ tone = "success", message }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
      setToasts((current) => [...current, { id, tone, message }]);
      setTimeout(() => dismissToast(id), 3800);
    },
    [dismissToast],
  );

  // Reads the per-user starred file ids saved locally (UI preference only).
  const readStars = useCallback(() => {
    try {
      const raw = localStorage.getItem("lumen-vault-stars");
      return new Set(Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  }, []);

  const writeStars = useCallback((ids) => {
    try {
      localStorage.setItem("lumen-vault-stars", JSON.stringify([...ids]));
    } catch {
      /* storage unavailable — stars live in memory for this session */
    }
  }, []);

  // One load pulls everything the workspace needs: all files (list endpoint
  // pages 50 at a time — fetchAllFiles walks the pages) plus all folders.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [files, foldersData] = await Promise.all([cloud.fetchAllFiles(), cloud.fetchFolders()]);
      const folders = foldersData?.folders ?? [];
      const stars = readStars();
      setLibrary({
        files: files.map((file) => withKind(file, stars)),
        folders: folders.map((folder) => ({ ...folder, fileCount: 0 })),
      });
      // Second pass: count the files inside each folder.
      setLibrary((state) => {
        if (!state) return state;
        const counts = new Map();
        state.files.forEach((file) => {
          const key = file.folder?._id ?? file.folder ?? null;
          if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
        });
        return {
          ...state,
          folders: state.folders.map((folder) => ({ ...folder, fileCount: counts.get(folder._id) ?? 0 })),
        };
      });
    } catch (cause) {
      setError(cloud.messageFromError(cause, "Couldn't load your library."));
    } finally {
      setLoading(false);
    }
  }, [readStars]);

  useEffect(() => {
    load();
  }, [load]);

  const requireLibrary = useCallback(() => {
    if (!library) throw new Error("Library not loaded yet.");
    return library;
  }, [library]);

  const fileId = (file) => file?._id ?? file?.id ?? null;

  const toggleStar = useCallback(
    async (id) => {
      const stars = readStars();
      if (stars.has(id)) stars.delete(id);
      else stars.add(id);
      writeStars(stars);
      setLibrary((state) =>
        state
          ? { ...state, files: state.files.map((file) => (fileId(file) === id ? { ...file, starred: stars.has(id) } : file)) }
          : state,
      );
      return stars.has(id);
    },
    [readStars, writeStars],
  );

  const renameFile = useCallback(
    async (id, name) => {
      try {
        const updated = await cloud.renameFile(id, name);
        setLibrary((state) =>
          state
            ? {
                ...state,
                files: state.files.map((file) =>
                  fileId(file) === id ? { ...file, displayName: updated.displayName, updatedAt: updated.updatedAt ?? file.updatedAt } : file,
                ),
              }
            : state,
        );
        pushToast({ message: "Renamed" });
        return updated;
      } catch (cause) {
        pushToast({ tone: "error", message: cloud.messageFromError(cause, "Rename failed. Try again.") });
        return null;
      }
    },
    [pushToast],
  );

  const trashFiles = useCallback(
    async (ids) => {
      let deleted = 0;
      let lastError = null;
      for (const id of ids) {
        try {
          await cloud.deleteFile(id);
          deleted += 1;
        } catch (cause) {
          lastError = cause;
        }
      }
      if (deleted) {
      setLibrary((state) => {
        if (!state) return state;
        return {
          ...state,
          files: state.files.filter((file) => !ids.includes(fileId(file))),
        };
      });
      setSharedLinks((current) => current.filter((link) => (link.file?._id ?? link.file) && !ids.includes(link.file._id)));
        pushToast({ message: deleted > 1 ? `${deleted} items deleted` : "Item deleted" });
      }
      if (lastError) {
        pushToast({ tone: "error", message: cloud.messageFromError(lastError, "Couldn't delete some items. Try again.") });
      }
      return deleted;
    },
    [pushToast],
  );

  // Moves a file to a folder (or to the library root with `folderId = null`).
  // Folder counts are recomputed locally so both card badges stay truthful.
  const moveFile = useCallback(
    async (id, folderId = null) => {
      try {
        const updated = await cloud.moveFile(id, folderId);
        setLibrary((state) => {
          if (!state) return state;
          const next = {
            ...state,
            files: state.files.map((file) =>
              fileId(file) === id
                ? { ...file, folder: updated?.folder ?? folderId ?? null }
                : file,
            ),
          };
          const counts = new Map();
          next.files.forEach((file) => {
            const key = file.folder?._id ?? file.folder ?? null;
            if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
          });
          next.folders = next.folders.map((folder) => ({
            ...folder,
            fileCount: counts.get(folder._id) ?? 0,
          }));
          return next;
        });
        pushToast({ message: folderId ? "File moved" : "File moved to My Files" });
        return updated;
      } catch (cause) {
        pushToast({ tone: "error", message: cloud.messageFromError(cause, "Couldn't move the file. Try again.") });
        return null;
      }
    },
    [pushToast],
  );

  const createFolder = useCallback(
    async (name) => {
      try {
        const folder = await cloud.createFolder(name);
        setLibrary((state) => (state ? { ...state, folders: [...state.folders, { ...folder, fileCount: 0 }] } : state));
        pushToast({ message: `Folder “${name}” created` });
        return folder;
      } catch (cause) {
        pushToast({ tone: "error", message: cloud.messageFromError(cause, "Couldn't create folder. Try again.") });
        return null;
      }
    },
    [pushToast],
  );

  const renameFolder = useCallback(
    async (id, name) => {
      try {
        const updated = await cloud.renameFolder(id, name);
        setLibrary((state) =>
          state
            ? {
                ...state,
                folders: state.folders.map((folder) => (folder._id === id ? { ...folder, name: updated.name } : folder)),
              }
            : state,
        );
        pushToast({ message: "Folder renamed" });
        return updated;
      } catch (cause) {
        pushToast({ tone: "error", message: cloud.messageFromError(cause, "Couldn't rename the folder. Try again.") });
        return null;
      }
    },
    [pushToast],
  );

  const removeFolder = useCallback(
    async (id) => {
      try {
        await cloud.deleteFolder(id);
        setLibrary((state) => {
          if (!state) return state;
          const detached = new Set([id]); // deleted folder + its subfolders move up
          let changed = true;
          while (changed) {
            changed = false;
            state.folders.forEach((folder) => {
              const parent = folder.parentId ?? folder.parent?._id ?? folder.parent ?? null;
              if (parent && detached.has(parent) && !detached.has(folder._id)) {
                detached.add(folder._id);
                changed = true;
              }
            });
          }
          return {
            ...state,
            folders: state.folders.filter((folder) => !detached.has(folder._id)),
          };
        });
        pushToast({ message: "Folder deleted" });
        return true;
      } catch (cause) {
        pushToast({ tone: "error", message: cloud.messageFromError(cause, "Couldn't delete the folder. Try again.") });
        return false;
      }
    },
    [pushToast],
  );

  const startUpload = useCallback(
    (fileList, folderId = null) => {
      const files = [...fileList];
      if (!files.length) return;

      const queued = files.map((file) => ({
        id: `q-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        name: file.name,
        size: file.size,
        kind: kindOf({ mimeType: file.type }),
        progress: 0,
        status: "uploading",
        controller: null,
      }));
      setUploads((current) => [...current, ...queued]);

      files.forEach((file, index) => {
        const item = queued[index];
        const controller = new AbortController();
        item.controller = controller;
        cloud
          .uploadFile({
            file,
            folderId,
            signal: controller.signal,
            onProgress: (progress) =>
              setUploads((current) => current.map((entry) => (entry.id === item.id ? { ...entry, progress } : entry))),
          })
          .then((record) => {
            setLibrary((state) => {
              if (!state) return state;
              const stars = readStars();
              const next = { ...state, files: [withKind(record, stars), ...state.files] };
              if (folderId) {
                next.folders = next.folders.map((folder) =>
                  folder._id === folderId ? { ...folder, fileCount: (folder.fileCount ?? 0) + 1 } : folder,
                );
              }
              return next;
            });
            setUploads((current) => current.map((entry) => (entry.id === item.id ? { ...entry, status: "done", progress: 100 } : entry)));
          })
          .catch((cause) => {
            const cancelled = cause?.code === "ERR_CANCELED" || cause?.name === "CanceledError";
            setUploads((current) => current.map((entry) => (entry.id === item.id ? { ...entry, status: cancelled ? "cancelled" : "failed" } : entry)));
            if (!cancelled) {
              pushToast({ tone: "error", message: cloud.messageFromError(cause, `${item.name} failed to upload`) });
            }
          });
      });
    },
    [pushToast, readStars],
  );

  const cancelUpload = useCallback((id) => {
    setUploads((current) => {
      const entry = current.find((item) => item.id === id);
      entry?.controller?.abort();
      return current.map((item) => (item.id === id ? { ...item, status: "cancelled" } : item));
    });
  }, []);

  const clearFinishedUploads = useCallback(() => {
    setUploads((current) => current.filter((entry) => entry.status === "uploading"));
  }, []);

  const shareFile = useCallback(async (id, options) => {
    return cloud.createShareLink(id, options?.expiresAt ?? null);
  }, []);

  const revokeShare = useCallback(
    async (id) => {
      try {
        await cloud.revokeShareLink(id);
        setSharedLinks((current) => current.filter((link) => (link.file?._id ?? link.file) !== id));
        return true;
      } catch (cause) {
        pushToast({ tone: "error", message: cloud.messageFromError(cause, "Couldn't revoke the link. Try again.") });
        return false;
      }
    },
    [pushToast],
  );

  const loadSharedLinks = useCallback(async () => {
    try {
      const data = await cloud.fetchShareLinks();
      setSharedLinks(data?.links ?? []);
      return data?.links ?? [];
    } catch (cause) {
      pushToast({ tone: "error", message: cloud.messageFromError(cause, "Couldn't load your shared links.") });
      return [];
    }
  }, [pushToast]);

  const value = useMemo(() => {
    const base = library ?? { files: [], folders: [] };
    const sortedFiles = [...base.files].sort(sorters[sort] ?? sorters.newest);
    return {
      loading,
      error,
      retry: load,
      sort,
      setSort,
      toasts,
      pushToast,
      dismissToast,
      uploads,
      startUpload,
      clearFinishedUploads,
      cancelUpload,
      requireLibrary,
      toggleStar,
      renameFile,
      moveFile,
      trashFiles,
      createFolder,
      renameFolder,
      removeFolder,
      shareFile,
      revokeShare,
      sharedLinks,
      loadSharedLinks,
      uploadOpen,
      setUploadOpen,
      uploadFolderId,
      setUploadFolderId,
      newFolderOpen,
      setNewFolderOpen,
      folders: base.folders,
      files: sortedFiles,
      rawFiles: base.files,
    };
  }, [
    library, loading, error, load, sort, toasts, pushToast, dismissToast, uploads,
    startUpload, clearFinishedUploads, cancelUpload, requireLibrary, toggleStar,
    renameFile, moveFile, trashFiles, createFolder, renameFolder, removeFolder, shareFile,
    revokeShare, sharedLinks, loadSharedLinks, uploadOpen, uploadFolderId, newFolderOpen,
  ]);

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

const sorters = {
  name: (a, b) => (a.displayName ?? "").localeCompare(b.displayName ?? ""),
  newest: (a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0),
  oldest: (a, b) => new Date(a.createdAt ?? 0) - new Date(b.createdAt ?? 0),
  size: (a, b) => (b.size ?? 0) - (a.size ?? 0),
};

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) throw new Error("useLibrary must be used within LibraryProvider");
  return context;
}

export default LibraryContext;
