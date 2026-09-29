import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as mockApi from "../services/mockApi";
import api from "../services/api";
import { friendlyError, normalizeFile, unwrap } from "../services/f2Api";

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
    async (fileId, name, folderId) => {
      try {
        const data = unwrap(await api.patch(`/files/${fileId}`, { displayName: name, folderId: folderId || null }));
        const updated = normalizeFile(data.file ?? data);
        setLibrary((state) => ({
          ...state,
          files: state.files.map((file) => (file.id === fileId ? { ...file, ...updated } : file)),
        }));
        pushToast({ message: "File details updated" });
        return updated;
      } catch (error) {
        pushToast({ tone: "error", message: friendlyError(error, "Unable to update this file.") });
        return null;
      }
    },
    [pushToast],
  );

  const trashFiles = useCallback(
    async (fileIds) => {
      try {
        await Promise.all(fileIds.map((id) => api.delete(`/files/${id}`)));
        setLibrary((state) => ({
          ...state,
          files: state.files.filter((file) => !fileIds.includes(file.id)),
        }));
        pushToast({ message: fileIds.length > 1 ? `${fileIds.length} files deleted` : "File deleted" });
      } catch (error) {
        pushToast({ tone: "error", message: friendlyError(error, "Unable to delete the selected files.") });
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
        const data = unwrap(await api.post("/folders", { name, parentId }));
        const folder = { ...(data.folder ?? data), id: data.folder?._id ?? data._id ?? data.folder?.id ?? data.id, fileCount: 0 };
        setLibrary((state) => ({ ...state, folders: [...state.folders, folder] }));
        pushToast({ message: `Folder “${name}” created` });
        return folder;
      } catch (error) {
        pushToast({ tone: "error", message: friendlyError(error, "Unable to create this folder.") });
        return null;
      }
    },
    [pushToast],
  );

  const deleteFolder = useCallback(
    async (folderId) => {
      try {
        await api.delete(`/folders/${folderId}`);
        setLibrary((state) => ({
          ...state,
          folders: state.folders.filter((folder) => folder.id !== folderId),
          files: state.files.map((file) => (file.folderId === folderId ? { ...file, folderId: null } : file)),
        }));
        pushToast({ message: "Folder deleted. Its files are now in My Files." });
        return true;
      } catch (error) {
        pushToast({ tone: "error", message: friendlyError(error, "Unable to delete this folder.") });
        return false;
      }
    },
    [pushToast],
  );

  const upsertFile = useCallback((serverFile) => {
    const file = normalizeFile(serverFile?.file ?? serverFile);
    setLibrary((state) => state ? ({
      ...state,
      files: [file, ...state.files.filter((item) => item.id !== file.id)],
      recentIds: [file.id, ...state.recentIds.filter((id) => id !== file.id)],
    }) : state);
  }, []);

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
      const data = unwrap(await api.post(`/files/${fileId}/share`, options || {}));
      const result = data.shareLink ?? data.link ?? data;
      if (library) setLibrary((state) => ({ ...state, files: state.files.map((file) => (file.id === fileId ? { ...file, shared: true } : file)) }));
      return result;
    },
    [library],
  );

  const revokeShare = useCallback(async (fileId) => {
    await api.delete(`/files/${fileId}/share`);
    setLibrary((state) => state ? ({ ...state, files: state.files.map((file) => (file.id === fileId ? { ...file, shared: false } : file)) }) : state);
  }, []);

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
      deleteFolder,
      shareFile,
      revokeShare,
      upsertFile,
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
    deleteFolder, shareFile, revokeShare, upsertFile, uploadOpen, newFolderOpen,
  ]);

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) throw new Error("useLibrary must be used within LibraryProvider");
  return context;
}

export default LibraryContext;

