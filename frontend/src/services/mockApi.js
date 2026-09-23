// Mock API layer. Every function returns a promise with simulated latency so
// loading skeletons are real. When the backend ships, replace the bodies with
// `api.get(...)` / `api.post(...)` calls from ./api.js — the signatures stay.
import {
  demoUser,
  demoStorage,
  demoFolders,
  demoFiles,
  demoNestedFiles,
  demoSharedLinks,
  demoSharedWithMe,
  demoTrash,
  demoActivity,
  demoRecentIds,
} from "./mockData";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const latency = () => wait(420 + Math.random() * 380);

// In-memory working copy of the demo library.
const db = {
  user: { ...demoUser },
  storage: { ...demoStorage },
  folders: [...demoFolders],
  files: [...demoFiles, ...demoNestedFiles],
  sharedWithMe: [...demoSharedWithMe],
  trash: [...demoTrash],
  activity: [...demoActivity],
  recentIds: [...demoRecentIds],
};

// Simulated network latency; a future error-state switch can hook in here.
async function guard() {
  await latency();
}

export async function getLibrary() {
  await guard();
  return {
    user: { ...db.user },
    storage: { ...db.storage },
    folders: db.folders.map((folder) => ({ ...folder })),
    files: db.files.map((file) => ({ ...file })),
    sharedWithMe: db.sharedWithMe.map((item) => ({ ...item })),
    trash: db.trash.map((item) => ({ ...item })),
    activity: [...db.activity],
    recentIds: [...db.recentIds],
  };
}

export async function getSharedLink(token) {
  await latency();
  return demoSharedLinks[token] || null;
}

export async function uploadFile({ name, size, folderId = null, onProgress }) {
  await wait(300);
  for (let pct = 8; pct <= 100; pct += 6) {
    onProgress?.(Math.min(pct, 100));
    await wait(90);
  }
  const kind = kindFromName(name);
  const record = {
    id: `up-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    name,
    kind,
    size,
    folderId,
    updatedAt: new Date().toISOString(),
    starred: false,
    shared: false,
  };
  db.files.unshift(record);
  if (folderId) {
    const folder = db.folders.find((f) => f.id === folderId);
    if (folder) folder.fileCount += 1;
  }
  db.activity.unshift({ id: `a-${Date.now()}`, type: "upload", target: name, actor: "You", at: record.updatedAt });
  db.recentIds.unshift(record.id);
  db.storage.usedGb = Math.round((db.storage.usedGb + size / 1024 ** 3) * 10) / 10;
  db.storage.usedLabel = `${db.storage.usedGb.toFixed(1)} GB`;
  return { ...record };
}

export async function toggleStar(id) {
  await guard();
  const file = db.files.find((f) => f.id === id);
  if (file) {
    file.starred = !file.starred;
    db.activity.unshift({
      id: `a-${Date.now()}`,
      type: "star",
      target: file.name,
      actor: "You",
      at: new Date().toISOString(),
    });
    return { ...file };
  }
  return null;
}

export async function renameFile(id, name) {
  await guard();
  const file = db.files.find((f) => f.id === id);
  if (!file) return null;
  file.name = name;
  file.updatedAt = new Date().toISOString();
  return { ...file };
}

export async function trashFile(id) {
  await guard();
  const index = db.files.findIndex((f) => f.id === id);
  if (index === -1) return false;
  const [file] = db.files.splice(index, 1);
  db.trash.unshift({
    id: file.id,
    name: file.name,
    kind: file.kind,
    size: file.size,
    deletedAt: new Date().toISOString(),
    restoreTo: file.folderId ? db.folders.find((f) => f.id === file.folderId)?.name ?? "Documents" : "My Files",
  });
  db.activity.unshift({ id: `a-${Date.now()}`, type: "trash", target: file.name, actor: "You", at: new Date().toISOString() });
  return true;
}

export async function restoreFile(id) {
  await guard();
  const index = db.trash.findIndex((t) => t.id === id);
  if (index === -1) return false;
  const [item] = db.trash.splice(index, 1);
  db.files.push({
    id: item.id,
    name: item.name,
    kind: item.kind,
    size: item.size,
    folderId: null,
    updatedAt: new Date().toISOString(),
    starred: false,
    shared: false,
  });
  return true;
}

export async function deleteForever(id) {
  await guard();
  db.trash = db.trash.filter((t) => t.id !== id);
  return true;
}

export async function emptyTrash() {
  await guard();
  db.trash = [];
  return true;
}

export async function createFolder(name, parentId = null) {
  await guard();
  const folder = {
    id: `f-${Date.now()}`,
    name,
    fileCount: 0,
    starred: false,
    parentId,
    updatedAt: new Date().toISOString(),
  };
  db.folders.push(folder);
  return { ...folder };
}

export async function shareFile(id, { email, permission }) {
  await guard();
  const file = db.files.find((f) => f.id === id);
  if (!file) return null;
  file.shared = true;
  db.activity.unshift({
    id: `a-${Date.now()}`,
    type: "share",
    target: file.name,
    actor: "You",
    at: new Date().toISOString(),
  });
  return {
    token: `link-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    permission,
    email,
  };
}

export function kindFromName(name) {
  const ext = name.split(".").pop().toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
  if (["doc", "docx", "txt", "rtf"].includes(ext)) return "doc";
  if (["xls", "xlsx", "csv"].includes(ext)) return "sheet";
  if (["ppt", "pptx"].includes(ext)) return "slides";
  if (["zip", "rar", "7z"].includes(ext)) return "archive";
  if (["mp4", "mov", "webm"].includes(ext)) return "video";
  if (["mp3", "wav", "m4a", "flac"].includes(ext)) return "audio";
  return "pdf";
}

