import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as mockApi from "../services/mockApi";

const LibraryContext = createContext(null);

const sorters = {
  name: (a, b) => a.name.localeCompare(b.name),
  newest: (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
  oldest: (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt),
  size: (a, b) => b.size - a.size,
};

export function LibraryProvider({ children }) {
  const [library, setLibrary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState("newest");
  const [toasts, setToasts] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);

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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mockApi.getLibrary();
      setLibrary(data);
    } catch (cause) {
      setError(cause.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const requireLibrary = useCallback(() => {
    if (!library) throw new Error("Library not loaded yet.");
    return library;
  }, [library]);

  const toggleStar = useCallback(
    async (fileId) => {
      const current = requireLibrary();
      const target = current.files.find((file) => file.id === fileId);
      setLibrary((state) => ({
        ...state,
        files: state.files.map((file) => (file.id === fileId ? { ...file, starred: !file.starred } : file)),
      }));
      try {
        await mockApi.toggleStar(fileId);
      } catch {
        setLibrary((state) => ({
          ...state,
          files: state.files.map((file) => (file.id === fileId ? { ...file, starred: !file.starred } : file)),
        }));
        pushToast({ tone: "error", message: "Couldn't update that file. Try again." });
      }
      return target ? !target.starred : false;
    },
    [pushToast, requireLibrary],
  );

  const renameFile = useCallback(
    async (fileId, name) => {
      try {
        const updated = await mockApi.renameFile(fileId, name);
        setLibrary((state) => ({
          ...state,
          files: state.files.map((file) => (file.id === fileId ? { ...file, name: updated.name, updatedAt: updated.updatedAt } : file)),
        }));
        pushToast({ message: "Renamed" });
      } catch {
        pushToast({ tone: "error", message: "Rename failed. Try again." });
      }
    },
    [pushToast],
  );

  const trashFiles = useCallback(
    async (fileIds) => {
      try {
        await Promise.all(fileIds.map((id) => mockApi.trashFile(id)));
        setLibrary((state) => ({
          ...state,
          files: state.files.filter((file) => !fileIds.includes(file.id)),
          trash: [
            ...fileIds
              .map((id) => state.files.find((file) => file.id === id))
              .filter(Boolean)
              .map((file) => ({
                id: file.id,
                name: file.name,
                kind: file.kind,
                size: file.size,
                deletedAt: new Date().toISOString(),
                restoreTo: state.folders.find((folder) => folder.id === file.folderId)?.name ?? "My Files",
              })),
            ...state.trash,
          ],
        }));
        pushToast({ message: fileIds.length > 1 ? `${fileIds.length} items moved to trash` : "Moved to trash" });
      } catch {
        pushToast({ tone: "error", message: "Couldn't move to trash. Try again." });
      }
    },
    [pushToast],
  );

  const restoreFiles = useCallback(
    async (ids) => {
      try {
        await Promise.all(ids.map((id) => mockApi.restoreFile(id)));
        setLibrary((state) => {
          const restored = state.trash.filter((item) => ids.includes(item.id));
          return {
            ...state,
            trash: state.trash.filter((item) => !ids.includes(item.id)),
            files: [
              ...state.files,
              ...restored.map((item) => ({
                id: item.id,
                name: item.name,
                kind: item.kind,
                size: item.size,
                folderId: null,
                updatedAt: new Date().toISOString(),
                starred: false,
                shared: false,
              })),
            ],
          };
        });
        pushToast({ message: ids.length > 1 ? "Items restored" : "Item restored" });
      } catch {
        pushToast({ tone: "error", message: "Restore failed. Try again." });
      }
    },
    [pushToast],
  );

  const deleteForever = useCallback(
    async (ids) => {
      try {
        await Promise.all(ids.map((id) => mockApi.deleteForever(id)));
        setLibrary((state) => ({ ...state, trash: state.trash.filter((item) => !ids.includes(item.id)) }));
        pushToast({ message: ids.length > 1 ? "Items deleted" : "Item deleted" });
      } catch {
        pushToast({ tone: "error", message: "Delete failed. Try again." });
      }
    },
    [pushToast],
  );

  const emptyTrash = useCallback(async () => {
    try {
      await mockApi.emptyTrash();
      setLibrary((state) => ({ ...state, trash: [] }));
      pushToast({ message: "Trash is empty" });
    } catch {
      pushToast({ tone: "error", message: "Couldn't empty trash. Try again." });
    }
  }, [pushToast]);

  const createFolder = useCallback(
    async (name, parentId = null) => {
      try {
        const folder = await mockApi.createFolder(name, parentId);
        setLibrary((state) => ({ ...state, folders: [...state.folders, folder] }));
        pushToast({ message: `Folder “${name}” created` });
        return folder;
      } catch {
        pushToast({ tone: "error", message: "Couldn't create folder. Try again." });
        return null;
      }
    },
    [pushToast],
  );

  const startUpload = useCallback(
    (files, folderId = null) => {
      const queued = [...files].map((file) => ({
        id: `q-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        name: file.name,
        size: file.size,
        progress: 0,
        status: "uploading",
      }));
      setUploads((current) => [...current, ...queued]);

      queued.forEach((item, index) => {
        mockApi
          .uploadFile({
            name: item.name,
            size: item.size,
            folderId,
            onProgress: (progress) =>
              setUploads((current) => current.map((entry) => (entry.id === item.id ? { ...entry, progress } : entry))),
          })
          .then((record) => {
            setLibrary((state) =>
              state
                ? {
                    ...state,
                    files: [record, ...state.files],
                    recentIds: [record.id, ...state.recentIds],
                    storage: {
                      ...state.storage,
                      usedGb: Math.round((state.storage.usedGb + record.size / 1024 ** 3) * 10) / 10,
                      usedLabel: `${Math.round((state.storage.usedGb + record.size / 1024 ** 3) * 10) / 10} GB`,
                    },
                  }
                : state,
            );
            setUploads((current) => current.map((entry) => (entry.id === item.id ? { ...entry, status: "done", progress: 100 } : entry)));
          })
          .catch(() => {
            setUploads((current) => current.map((entry) => (entry.id === item.id ? { ...entry, status: "failed" } : entry)));
            pushToast({ tone: "error", message: `${item.name} failed to upload` });
          });
      });
    },
    [pushToast],
  );

  const clearFinishedUploads = useCallback(() => {
    setUploads((current) => current.filter((entry) => entry.status === "uploading"));
  }, []);

  const cancelUpload = useCallback((id) => {
    setUploads((current) => current.map((entry) => (entry.id === id ? { ...entry, status: "cancelled" } : entry)));
  }, []);

  const shareFile = useCallback(
    async (fileId, options) => {
      const result = await mockApi.shareFile(fileId, options);
      if (result && library) {
        setLibrary((state) => ({
          ...state,
          files: state.files.map((file) => (file.id === fileId ? { ...file, shared: true } : file)),
        }));
      }
      return result;
    },
    [library],
  );

  const value = useMemo(() => {
    const base = library ?? { folders: [], files: [], sharedWithMe: [], trash: [], activity: [], recentIds: [], storage: null, user: null };
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
      trashFiles,
      restoreFiles,
      deleteForever,
      emptyTrash,
      createFolder,
      shareFile,
      uploadOpen,
      setUploadOpen,
      newFolderOpen,
      setNewFolderOpen,
      folders: base.folders,
      files: sortedFiles,
      rawFiles: base.files,
      sharedWithMe: base.sharedWithMe,
      trash: base.trash,
      activity: base.activity,
      recentIds: base.recentIds,
      storage: base.storage,
      user: base.user,
    };
  }, [
    library, loading, error, load, sort, toasts, pushToast, dismissToast, uploads,
    startUpload, clearFinishedUploads, cancelUpload, requireLibrary, toggleStar,
    renameFile, trashFiles, restoreFiles, deleteForever, emptyTrash, createFolder,
    shareFile, uploadOpen, newFolderOpen,
  ]);

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) throw new Error("useLibrary must be used within LibraryProvider");
  return context;
}

export default LibraryContext;

