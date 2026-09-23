// Demo library data for the Lumen Vault product UI.
// Shapes mirror a future REST payload so screens can switch to the real API
// without changing presentation code. Sizes are in bytes unless noted.

export const demoUser = {
  id: "u1",
  name: "Ada Nakamura",
  email: "ada@lumenvault.app",
  initials: "AN",
  plan: "Plus",
  twoFactor: false,
  memberSince: "March 2024",
};

export const demoStorage = {
  totalLabel: "100 GB",
  totalGb: 100,
  usedGb: 38.4,
  usedLabel: "38.4 GB",
  breakdown: [
    { key: "photos", label: "Photos", gb: 14.2, color: "#3B5BFD" },
    { key: "documents", label: "Documents", gb: 9.6, color: "#1F3AC2" },
    { key: "videos", label: "Video", gb: 8.9, color: "#7B8CDE" },
    { key: "other", label: "Other", gb: 5.7, color: "#C9D2E3" },
  ],
};

// Folder records. `parentId` nests a folder inside another folder.
export const demoFolders = [
  { id: "f1", name: "Documents", fileCount: 12, starred: false, updatedAt: "2026-09-20T09:12:00" },
  { id: "f2", name: "Photos", fileCount: 86, starred: true, updatedAt: "2026-09-19T15:40:00" },
  { id: "f3", name: "Client Work", fileCount: 34, starred: true, updatedAt: "2026-09-18T11:05:00" },
  { id: "f4", name: "Design Files", fileCount: 21, starred: false, parentId: "f3", updatedAt: "2026-09-17T08:22:00" },
  { id: "f5", name: "Invoices", fileCount: 9, starred: false, updatedAt: "2026-09-15T16:48:00" },
  { id: "f6", name: "Personal", fileCount: 18, starred: false, updatedAt: "2026-09-12T10:30:00" },
];

// File records. `folderId` is null for items at the library root.
export const demoFiles = [
  {
    id: "file-01",
    name: "Project Proposal.pdf",
    kind: "pdf",
    size: 2516582,
    folderId: "f1",
    updatedAt: "2026-09-21T14:32:00",
    starred: true,
    shared: false,
  },
  {
    id: "file-02",
    name: "Brand Guidelines.pdf",
    kind: "pdf",
    size: 8912896,
    folderId: "f3",
    updatedAt: "2026-09-21T09:05:00",
    starred: true,
    shared: true,
  },
  {
    id: "file-03",
    name: "Financial Report.xlsx",
    kind: "sheet",
    size: 1572864,
    folderId: "f1",
    updatedAt: "2026-09-20T17:20:00",
    starred: false,
    shared: false,
  },
  {
    id: "file-04",
    name: "Product Demo.mp4",
    kind: "video",
    size: 68157440,
    folderId: null,
    updatedAt: "2026-09-20T10:14:00",
    starred: false,
    shared: false,
  },
  {
    id: "file-05",
    name: "Team Offsite.png",
    kind: "image",
    size: 3355443,
    folderId: "f2",
    updatedAt: "2026-09-19T19:48:00",
    starred: false,
    shared: false,
    thumb: "https://picsum.photos/seed/lv-offsite/640/440",
  },
  {
    id: "file-06",
    name: "Roadmap 2026.pptx",
    kind: "slides",
    size: 11534336,
    folderId: "f1",
    updatedAt: "2026-09-19T08:47:00",
    starred: false,
    shared: true,
  },
  {
    id: "file-07",
    name: "Contract – Northwind.docx",
    kind: "doc",
    size: 491520,
    folderId: "f3",
    updatedAt: "2026-09-18T13:26:00",
    starred: false,
    shared: false,
  },
  {
    id: "file-08",
    name: "Website Assets.zip",
    kind: "archive",
    size: 48234496,
    folderId: "f3",
    updatedAt: "2026-09-17T15:02:00",
    starred: false,
    shared: false,
  },
  {
    id: "file-09",
    name: "Studio Session.mp3",
    kind: "audio",
    size: 8388608,
    folderId: "f6",
    updatedAt: "2026-09-16T20:11:00",
    starred: false,
    shared: false,
  },
  {
    id: "file-10",
    name: "vacation-photos.zip",
    kind: "archive",
    size: 125829120,
    folderId: "f2",
    updatedAt: "2026-09-15T09:36:00",
    starred: false,
    shared: false,
  },
  {
    id: "file-11",
    name: "Invoice #2041.pdf",
    kind: "pdf",
    size: 219136,
    folderId: "f5",
    updatedAt: "2026-09-14T11:55:00",
    starred: false,
    shared: false,
  },
  {
    id: "file-12",
    name: "Kyoto Trip.jpg",
    kind: "image",
    size: 4404019,
    folderId: "f2",
    updatedAt: "2026-09-13T18:29:00",
    starred: true,
    shared: false,
    thumb: "https://picsum.photos/seed/lv-kyoto/640/440",
  },
  {
    id: "file-13",
    name: "Q3 Notes.docx",
    kind: "doc",
    size: 367001,
    folderId: "f1",
    updatedAt: "2026-09-12T16:03:00",
    starred: false,
    shared: false,
  },
  {
    id: "file-14",
    name: "Logo Explorations.png",
    kind: "image",
    size: 2726298,
    folderId: "f4",
    updatedAt: "2026-09-11T12:40:00",
    starred: false,
    shared: false,
    thumb: "https://picsum.photos/seed/lv-logo/640/440",
  },
  {
    id: "file-15",
    name: "Podcast Interview.m4a",
    kind: "audio",
    size: 14680064,
    folderId: "f6",
    updatedAt: "2026-09-10T07:58:00",
    starred: false,
    shared: false,
  },
];

// Files inside folders f3 and f4 so folder browsing has depth.
export const demoNestedFiles = [
  {
    id: "file-16",
    name: "Statement of Work.pdf",
    kind: "pdf",
    size: 1310720,
    folderId: "f4",
    updatedAt: "2026-09-16T14:15:00",
    starred: false,
    shared: false,
  },
  {
    id: "file-17",
    name: "Moodboard.jpg",
    kind: "image",
    size: 5242880,
    folderId: "f4",
    updatedAt: "2026-09-16T11:02:00",
    starred: false,
    shared: false,
    thumb: "https://picsum.photos/seed/lv-mood/640/440",
  },
];

// Public share records for the /share/:token page.
export const demoSharedLinks = {
  "brand-2026": {
    id: "brand-2026",
    name: "Brand Guidelines.pdf",
    kind: "pdf",
    size: 8912896,
    owner: "Ada Nakamura",
    createdAt: "2026-09-21T09:05:00",
  },
  "proposal-preview": {
    id: "proposal-preview",
    name: "Project Proposal.pdf",
    kind: "pdf",
    size: 2516582,
    owner: "Ada Nakamura",
    createdAt: "2025-09-20T14:32:00",
  },
};

export const demoActivity = [
  { id: "a1", type: "upload", target: "Product Demo.mp4", actor: "You", at: "2026-09-21T14:32:00" },
  { id: "a2", type: "share", target: "Brand Guidelines.pdf", actor: "You", at: "2026-09-21T09:05:00" },
  { id: "a3", type: "star", target: "Kyoto Trip.jpg", actor: "You", at: "2026-09-20T21:18:00" },
  { id: "a4", type: "rename", target: "Website Assets.zip", actor: "You", at: "2026-09-18T15:02:00" },
  { id: "a5", type: "trash", target: "Old Drafts.docx", actor: "You", at: "2026-09-17T10:44:00" },
  { id: "a6", type: "upload", target: "Team Offsite.png", actor: "You", at: "2026-09-19T19:48:00" },
];

export const demoSharedWithMe = [
  { id: "s1", fileId: "brand-2026", name: "Brand Guidelines.pdf", kind: "pdf", size: 8912896, from: "Marcus Chen", avatarBg: "#7B8CDE", at: "2026-09-21T09:05:00", permission: "view" },
  { id: "s2", fileId: null, name: "Market Research.xlsx", kind: "sheet", size: 2359296, from: "Priya Raman", avatarBg: "#E1A4C5", at: "2026-09-19T12:30:00", permission: "edit" },
  { id: "s3", fileId: null, name: "Launch Plan.pptx", kind: "slides", size: 10485760, from: "Marcus Chen", avatarBg: "#7B8CDE", at: "2026-09-16T17:45:00", permission: "view" },
];

export const demoTrash = [
  { id: "t1", name: "Old Drafts.docx", kind: "doc", size: 245760, deletedAt: "2026-09-17T10:44:00", restoreTo: "Documents" },
  { id: "t2", name: "screenshot-final-final.png", kind: "image", size: 1572864, deletedAt: "2026-09-15T18:22:00", restoreTo: "Photos", thumb: "https://picsum.photos/seed/lv-shot/640/440" },
  { id: "t3", name: "test-export.csv", kind: "sheet", size: 38912, deletedAt: "2026-09-12T08:09:00", restoreTo: "Documents" },
];

// Files flagged as "recent" on the home screen, newest first.
export const demoRecentIds = ["file-01", "file-04", "file-05", "file-02", "file-06", "file-03"];

