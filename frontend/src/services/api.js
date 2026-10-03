import axios from "axios";

export { api }; // named export alongside the default (see bottom of file)

// Single axios instance for the whole app. The base URL comes from the
// VITE_API_URL env var (set in .env for local dev, in the hosting provider's
// environment variables for production); every backend response follows
// the { success, message, data } envelope.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

const TOKEN_KEY = "lumen-vault-token";

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable — session stays in memory only */
  }
}

// Attach the JWT to every request once the user is signed in.
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// When a token expires or is revoked mid-session the backend answers 401.
// Drop the stale session and land on the login screen with a notice.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && getStoredToken()) {
      storeToken(null);
      if (!window.location.pathname.startsWith("/login")) {
        window.location.replace("/login?expired=1");
      }
    }
    return Promise.reject(error);
  },
);

// Turns any axios/network failure into a readable message taken from the
// backend's { success, message, data } envelope — never "AxiosError" or "500".
export function messageFromError(error, fallback = "Something went wrong. Please try again.") {
  if (error?.code === "ERR_NETWORK") {
    return "Can't reach the server. Check your connection and try again.";
  }
  const data = error?.response?.data;
  if (data && typeof data === "object" && data.message) return data.message;
  if (typeof data === "string" && data) return data;
  return fallback;
}

// Validation failures come back as { message, errors: [{ param, msg }] };
// this maps them onto a { fieldName: message } object for inline display.
export function fieldErrorsFrom(error) {
  const items = error?.response?.data?.errors;
  const fields = {};
  if (Array.isArray(items)) {
    items.forEach((item) => {
      if (item?.param && !fields[item.param]) fields[item.param] = item.msg;
    });
  }
  return fields;
}

// Unwraps a success envelope into its data payload.
async function unwrap(request) {
  const response = await request;
  return response.data?.data ?? null;
}

/* ---------- Auth ---------- */

export async function register({ name, email, password }) {
  return unwrap(api.post("/auth/register", { name, email, password }));
}

export async function login({ email, password }) {
  return unwrap(api.post("/auth/login", { email, password }));
}

export async function fetchCurrentUser() {
  return unwrap(api.get("/auth/me"));
}

/* ---------- Folders ---------- */

export async function fetchFolders() {
  return unwrap(api.get("/folders"));
}

export async function createFolder(name) {
  return unwrap(api.post("/folders", { name }));
}

export async function renameFolder(id, name) {
  return unwrap(api.patch(`/folders/${id}`, { name }));
}

export async function deleteFolder(id) {
  return unwrap(api.delete(`/folders/${id}`));
}

/* ---------- Files ---------- */

// The list endpoint pages at most 50 files per request; this walks every
// page so the workspace can show the full library (and total size) at once.
export async function fetchAllFiles({ search, type, folder } = {}) {
  const params = {};
  if (search) params.search = search;
  if (type) params.type = type;
  if (folder) params.folder = folder;

  let page = 1;
  const files = [];
  for (;;) {
    const data = await unwrap(api.get("/files", { params: { ...params, page, limit: 50 } }));
    const batch = data?.files ?? [];
    files.push(...batch);
    const totalPages = data?.pagination?.totalPages ?? 1;
    if (page >= totalPages || batch.length === 0) break;
    page += 1;
  }
  return files;
}

export async function fetchFile(id) {
  return unwrap(api.get(`/files/${id}`));
}

export async function renameFile(id, displayName) {
  return unwrap(api.patch(`/files/${id}`, { displayName }));
}

export async function moveFile(id, folder) {
  return unwrap(api.patch(`/files/${id}`, { folder }));
}

export async function deleteFile(id) {
  return unwrap(api.delete(`/files/${id}`));
}

export function downloadFileUrl(id) {
  return `${api.defaults.baseURL}/files/${id}/download`;
}

// Owner downloads go through axios so the JWT rides in the Authorization
// header (a plain browser navigation could not send it). The bytes arrive as
// a blob and are handed to the browser as a file named after the
// Content-Disposition header the backend sets.
export async function downloadFileBlob(url, fallbackName = "download") {
  const response = await api.get(url, { responseType: "blob" });
  const header = String(response.headers?.["content-disposition"] ?? "");
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  const asciiMatch = header.match(/filename="?([^";]+)"?/i);
  let filename = fallbackName;
  if (utf8Match) filename = decodeURIComponent(utf8Match[1]);
  else if (asciiMatch) filename = asciiMatch[1];

  const objectUrl = URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
  return filename;
}

export function uploadFile({ file, folderId = null, onProgress, signal }) {
  const form = new FormData();
  form.append("file", file);
  if (folderId) form.append("folderId", folderId);
  return unwrap(
    api.post("/upload", form, {
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      },
      signal,
    }),
  );
}

/* ---------- Sharing ---------- */

export async function createShareLink(id, expiresAt = null) {
  return unwrap(api.post(`/files/${id}/share`, { expiresAt }));
}

export async function revokeShareLink(id) {
  return unwrap(api.delete(`/files/${id}/share`));
}

export async function fetchShareLinks() {
  return unwrap(api.get("/share/links"));
}

export function sharedFileUrl(token) {
  return `${window.location.origin}/share/${token}`;
}

export function shareDownloadUrl(token) {
  return `${api.defaults.baseURL}/share/${token}/download`;
}

/* ---------- Public (no auth) ---------- */

export async function fetchSharedFile(token) {
  return unwrap(api.get(`/share/${token}`));
}

export default api;
