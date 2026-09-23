# Lumen Vault — Frontend

Lumen Vault is a cloud file storage product: a calm place to store, organize, preview, and share files from any device. This repository contains the complete frontend — a mobile-first React application with a polished desktop experience, wrapped in a marketing site.

The frontend runs entirely on **demo data**. There is no live backend behind it yet; every screen is built so the real API can replace the mock layer without touching UI code (see [Swapping in the real API](#6-the-services-layer--swapping-in-the-real-api)).

**Try it:** run the dev server, open any screen — or sign in with any email address and a password of at least 6 characters to enter the demo workspace at `/app`.

---

## 1. Tech stack

| Concern          | Choice                                     |
| ---------------- | ------------------------------------------ |
| Build tool       | Vite 8                                     |
| UI framework     | React 18                                   |
| Routing          | React Router 7                             |
| Icons            | lucide-react (the only icon set used)      |
| Styling          | Plain CSS (`src/styles.css`), no framework |
| HTTP client      | axios (wired in `src/services/api.js`)     |
| Package manager  | npm                                        |

There is no Tailwind, CSS-in-JS, component library, or state-management library. If you are looking for one, you are looking too hard.

---

## 2. Getting started

**Prerequisites**

- Node.js **20.19+** or **22.12+** (required by Vite 8)
- npm

**Install and run**

```bash
cd frontend
npm install
npm run dev
```

| Script          | What it does                                      |
| --------------- | ------------------------------------------------- |
| `npm run dev`   | Starts the dev server (default: `localhost:5173`) |
| `npm run build` | Production build into `dist/`                     |
| `npm start`     | Alias for the dev server                          |

**Environment variables**

Copy `.env.example` to `.env` if you want to override the API target:

```
VITE_API_URL=http://localhost:5000/api
```

Nothing consumes this yet — it is read by `src/services/api.js` and will drive the real API client once the mock layer is replaced.

---

## 3. Project structure

```
frontend/src/
├── main.jsx              # Entry: BrowserRouter + <App/>
├── App.jsx               # Route table + AppLayout (app shell)
├── styles.css            # The entire design system, one file
│
├── pages/                # One component per route
│   ├── Landing.jsx       # Marketing home page
│   ├── About.jsx         # Product story page
│   ├── Login.jsx         # Sign in
│   ├── Register.jsx      # Create account
│   ├── ForgotPassword.jsx# Password reset request
│   ├── Home.jsx          # /app — dashboard
│   ├── Files.jsx         # /app/files + /app/files/folder/:folderId
│   ├── Starred.jsx       # /app/starred
│   ├── Shared.jsx        # /app/shared
│   ├── Trash.jsx         # /app/trash
│   ├── Profile.jsx       # /app/profile — settings
│   ├── SharedFile.jsx    # /share/:token — public download page
│   └── NotFound.jsx      # 404
│
├── components/
│   ├── [shell]           # App chrome
│   │   ├── Sidebar.jsx       # Desktop nav (≥1024px)
│   │   ├── BottomNav.jsx     # Mobile nav (<1024px)
│   │   ├── TopBar.jsx        # Sticky app header + account menu
│   │   ├── Navbar.jsx        # Marketing site header
│   │   └── Footer.jsx        # Marketing site footer
│   ├── [features]        # Domain widgets
│   │   ├── FileList.jsx      # List rows, grid cards, folder cards
│   │   ├── FileActions.jsx   # Per-file action bottom sheet
│   │   ├── FilePreview.jsx   # Full preview route (image/doc/video/audio)
│   │   ├── FileIcon.jsx      # Colored type tiles + image thumbs
│   │   ├── StorageCard.jsx   # Segmented storage usage card
│   │   ├── UploadModal.jsx   # Drop zone + queue + progress
│   │   ├── RenameModal.jsx
│   │   ├── ShareModal.jsx    # Invite by email + copyable link
│   │   ├── FolderPanel.jsx   # New-folder modal + breadcrumbs
│   │   └── AppMockup.jsx     # Phone mockup used as landing artwork
│   ├── [primitives]      # Reusable building blocks
│   │   ├── ui.jsx            # Button, Modal, BottomSheet, EmptyState, Toasts, Skeleton, Brand, Field…
│   │   └── hooks.js          # formatBytes, formatDate, useReveal, useBodyLock
│   └── ProtectedRoute.jsx    # Redirects to /login when signed out
│
├── context/
│   ├── AuthContext.jsx       # Mock auth: user in localStorage, login/signup/logout
│   └── LibraryContext.jsx    # Files, folders, trash, uploads, toasts, actions
│
└── services/
    ├── api.js            # axios instance (VITE_API_URL) — ready, unused
    ├── mockData.js       # The demo dataset
    └── mockApi.js        # Async "API" with simulated latency + mutations
```

### Routes

| Path                        | Page          | Auth required |
| --------------------------- | ------------- | ------------- |
| `/`                         | Landing       | no            |
| `/about`                    | About         | no            |
| `/login`                    | Login         | no            |
| `/register`                 | Register      | no            |
| `/forgot-password`          | ForgotPassword| no            |
| `/app`                      | Home          | yes           |
| `/app/files`                | Files         | yes           |
| `/app/files/folder/:id`     | Files         | yes           |
| `/app/starred`              | Starred       | yes           |
| `/app/shared`               | Shared        | yes           |
| `/app/trash`                | Trash         | yes           |
| `/app/profile`              | Profile       | yes           |
| `/app/preview/:fileId`      | FilePreview   | yes           |
| `/share/:token`             | SharedFile    | no (public)   |
| anything else               | NotFound      | no            |

---

## 4. Architecture & data flow

The app has two providers and one rule.

```
AuthProvider                → "who is signed in?" (localStorage)
  └── ProtectedRoute        → gates /app/*, redirects to /login
        └── LibraryProvider → "what is in the library?" (mock API)
              └── AppLayout → sidebar/bottom-nav, upload + new-folder
                             modals, toast stack, <Outlet/>
```

**The rule: all library state flows through `useLibrary()`.** Pages read `files`, `folders`, `trash`, `storage`, `uploads`, and toasts from the context, and change them only through its actions (`toggleStar`, `trashFiles`, `startUpload`, `createFolder`, …). No page fetches on its own or mutates state directly. This is what makes the mock→real swap a one-file change.

Context-managed UI state also lives in `LibraryContext` (`uploadOpen`, `newFolderOpen`) because modals are owned by `AppLayout` but triggered from any page — `<Outlet/>` cannot pass props down.

**Optimistic updates.** `toggleStar` updates the UI immediately, then calls the API; on failure it rolls back and shows an error toast. Other actions are request-then-update.

**Loading and errors.** `LibraryProvider` fetches the whole library once on mount. Screens render skeleton rows while `loading` is true and a retry panel when `error` is set.

---

## 5. Mock data

`services/mockData.js` holds the demo dataset: a user, storage stats, six folders, seventeen files, shared-with-me items, trash items, and an activity feed. Two things to know about it:

- **Shapes mirror a future REST payload.** A file looks like:

  ```json
  {
    "id": "file-01",
    "name": "Project Proposal.pdf",
    "kind": "pdf",
    "size": 2516582,
    "folderId": "f1",
    "updatedAt": "2026-09-21T14:32:00",
    "starred": true,
    "shared": false,
    "thumb": "https://picsum.photos/seed/lv-offsite/640/440"
  }
  ```

  `kind` is one of `pdf | doc | sheet | slides | image | video | audio | archive` and drives the icon and preview renderer. Image thumbnails use picsum.photos with a styled fallback if offline.

- **Storage numbers are labeled as demo data in the UI** ("demo data, not your real usage"). Keep that honesty when you replace the data.

---

## 6. The services layer & swapping in the real API

The swap is designed to touch **one file**: `services/mockApi.js`.

What exists today:

- **`services/api.js`** — an axios instance with `baseURL: import.meta.env.VITE_API_URL`, already created, currently unused.
- **`services/mockApi.js`** — async functions with the same signatures a real client would have, plus simulated latency (so skeletons are real) and in-memory mutations (so the UI actually changes).

Every `mockApi` function already takes plain objects, not React state. For example, `getLibrary()` returns a snapshot; `uploadFile({ name, size, folderId, onProgress })` reports progress through a callback; `toggleStar(id)` returns the updated record. The UI never knows the difference.

**Before (mock):**

```js
export async function getLibrary() {
  await guard(); // simulated latency
  return {
    user: { ...db.user },
    folders: db.folders.map((f) => ({ ...f })),
    files: db.files.map((f) => ({ ...f })),
    /* … trash, sharedWithMe, activity, storage … */
  };
}
```

**After (real):**

```js
import api from "./api.js";

export async function getLibrary() {
  const { data } = await api.get("/library");
  return data; // must match the shape above
}
```

**Migration checklist**

| Mock function                | Replace with                |
| ---------------------------- | --------------------------- |
| `getLibrary()`               | `GET /library` (or several) |
| `uploadFile({…, onProgress})`| `POST /files` (axios `onUploadProgress`) |
| `toggleStar(id)`             | `PATCH /files/:id`          |
| `renameFile(id, name)`       | `PATCH /files/:id`          |
| `trashFile(id)` / `restoreFile(id)` / `deleteForever(id)` / `emptyTrash()` | trash endpoints |
| `createFolder(name, parentId)` | `POST /folders`           |
| `shareFile(id, {email, permission})` | `POST /files/:id/share` |
| `getSharedLink(token)`       | `GET /share/:token`         |

`LibraryContext.jsx` needs no changes as long as return shapes match. Also note that `AuthContext` (login/signup/logout) is mocked with a `localStorage` user and will need the same treatment.

Until the backend exists, keep mutations working through `mockApi` — the optimistic-update pattern in `LibraryContext` is already the right shape for real requests.

---

## 7. Design system

Everything visual lives in `src/styles.css` as CSS custom properties. Plain CSS by design — no framework to fight.

### Tokens

```css
--bg: #f6f7f9;          /* app background            */
--surface: #ffffff;     /* cards, sheets, topbars    */
--surface-2: #f0f2f5;   /* hover fills, well fields  */
--ink: #101828;         /* primary text              */
--ink-2: #475467;       /* secondary text            */
--ink-3: #98a2b3;       /* metadata, placeholders    */
--line: #eaecf0;        /* hairline borders          */
--brand: #3b5bfd;       /* the one accent            */
--danger: #f04438;  --success: #12b76a;  --warning: #f79009;

--r-sm: 10px;  --r-md: 14px;  --r-lg: 20px;  --r-xl: 26px;

--shadow-xs / -sm / -md / -lg;   /* soft, two-layer   */

--font-body: "Inter";  --font-display: "Plus Jakarta Sans";
```

Type scale: page titles use `clamp(23px → 30px)`, hero display `clamp(34px → 58px)`. Buttons are pill-shaped (`border-radius: 999px`); primary buttons are **ink-black**, not brand-blue — blue is reserved for links, active states, and data.

### Component inventory

`ui.jsx` exports the reusable primitives: `Button` (`variant`: primary/dark/brand/soft/ghost/quiet/danger · `size`: sm/md/lg), `IconButton`, `Field`/`PasswordField`, `Modal`, `BottomSheet`, `EmptyState`, `Skeleton`/`FileSkeletonRows`, `Toasts`, `Avatar`, `Brand`.

### Conventions

- **Mobile-first.** Base styles target ~360–430px; desktop is the expansion. Bottom nav below 1024px, sidebar at/above. Sheets slide from the bottom on phones and become centered dialogs at ≥768px — one `Modal`/`BottomSheet` API, CSS decides.
- **Icons:** lucide-react only, sized 16–21px, one consistent stroke style. No emoji as UI icons.
- **Touch targets:** ≥40px for anything tappable (`--r-*` radii assume it).
- **Motion:** small and purposeful (sheet slide, toast pop, reveal-on-scroll via `useReveal`). Everything collapses under `prefers-reduced-motion: reduce`.
- **Safe areas:** bottom nav and sheets pad with `env(safe-area-inset-*)`.
- **File-type colors** are fixed tone classes (`tone-red` for PDF, `tone-green` for sheets, …) so a file is recognizable by color at a glance. Do not invent new tones casually.

---

## 8. Conventions & gotchas

- **New page?** Create it in `pages/`, add the route in `App.jsx`. If it lives under `/app`, it renders inside `AppLayout` automatically — no chrome to wire up.
- **New component?** Primitives (no domain knowledge) go in `ui.jsx`; everything else gets its own file in `components/`.
- **Styling:** add to `styles.css` under the matching section comment. Keep specificity flat — class selectors, no nesting wars.
- **Dependencies:** the stack is deliberately small. Adding a library needs a reason lucide/Vite/React can't already cover.
- **Demo honesty:** placeholder data must be labeled as demo (see the storage card). Nothing in the UI may reference the project's development history — no "capstone," school, or assignment wording anywhere, ever.
- **Exports:** `ui.jsx` and `hooks.js` are barrel-style; import from the module root (`components/ui.jsx`), not deep paths.
- **Known simplifications:** auth is mock-only; the trash "restore" puts files back at the library root; folder starring is display-only. All are deliberate scope cuts, not bugs.
