import api from "./api";

export function unwrap(response) {
  return response?.data?.data ?? response?.data ?? {};
}

export function friendlyError(error, fallback = "Something went wrong. Please try again.") {
  const serverMessage = error?.response?.data?.message;
  if (serverMessage) return serverMessage;
  const status = error?.response?.status;
  if (status === 401) return "Your session has expired. Please log in again.";
  if (status === 403) return "You don’t have permission to do that.";
  if (status === 404 || status === 410) return "This item or link is no longer available.";
  if (status === 413) return "This file is too large. The maximum size is 10 MB.";
  if (error?.message?.toLowerCase() === "network error") {
    return "Unable to connect to the server. Check that it is running and try again.";
  }
  return fallback;
}

export function normalizeFile(file = {}) {
  const name = file.displayName || file.originalName || file.name || "Untitled file";
  const extension = name.split(".").pop()?.toLowerCase();
  const kind = file.fileType || (file.mimeType?.startsWith("image/") ? "image" : extension === "pdf" ? "pdf" : "doc");
  return {
    ...file,
    id: file.id || file._id,
    name,
    kind,
    size: Number(file.size) || 0,
    folderId: file.folderId || file.folder?._id || file.folder?.id || file.folder || null,
    updatedAt: file.updatedAt || file.createdAt || new Date().toISOString(),
  };
}

export async function downloadToDevice(url, filename) {
  const response = await api.get(url, { responseType: "blob" });
  if (response.data?.type?.includes("application/json")) {
    throw new Error("This download is not available yet. Please try again later.");
  }
  const objectUrl = URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename || "download";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
