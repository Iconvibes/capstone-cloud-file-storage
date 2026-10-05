# Lumen Vault — Frontend

Lumen Vault is a cloud file storage product: a calm place to store, organize, preview, and share files from any device. This repository contains the complete frontend — a mobile-first React application with a polished desktop experience, wrapped in a marketing site.

The frontend is wired to the **real backend API** in `backend/` (see `../Readmefile.md` for the API reference): accounts, uploads with progress, folders, search, share links and downloads all talk to the live server. Copy `.env.example` to `.env` first so the API base URL is set.

**Try it:** start the backend, start the dev server, then create an account at `/register` and sign in.

---

## 1. Tech stack

| Concern          | Choice                                     |
| ---------------- | ------------------------------------------ |
| Build tool       | Vite 8                                     |
| UI framework     | React 18                                   |
| Routing          | React Router 7                             |
| Icons            | lucide-react (the only icon set used)      |
| Styling          | Plain CSS (`src/styles.css`), no framework |
| HTTP client      | axios (in `src/services/api.js`)           |
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

Copy `.env.example` to `.env` and point it at the running backend:

```
VITE_API_URL=http://localhost:5000/api
```

`src/services/api.js` reads this at build time; every request goes through that one axios instance (JWT attachment, error extraction).

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
│   ├── Shared.jsx        # /app/shared — your active share links
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
│   │   ├── FilePreview.jsx   # Full preview route (images render real bytes)
│   │   ├── FileIcon.jsx      # Colored type tiles + image thumbs
│   │   ├── StorageCard.jsx   # "X files · Y total size" stats card
│   │   ├── UploadModal.jsx   # Drop zone + queue + progress
│   │   ├── RenameModal.jsx   # Files and folders
│   │   ├── ShareModal.jsx    # Create / copy / revoke share links
│   │   ├── FolderPanel.jsx   # New-folder modal + breadcrumbs
│   │   └── AppMockup.jsx     # Phone mockup used as landing artwork
│   ├── [primitives]      # Reusable building blocks
│   │   ├── ui.jsx            # Button, Modal, BottomSheet, EmptyState, Toasts, Skeleton, Brand, Field…
│   │   └── hooks.js          # formatBytes, formatDate, useReveal, useBodyLock
│   └── ProtectedRoute.jsx    # Redirects to /login when signed out
│
├── context/
│   ├── AuthContext.jsx       # Register/login/logout, JWT + profile in localStorage
│   └── LibraryContext.jsx    # Files, folders, uploads, toasts, share links
│
└── services/
    └── api.js            # axios instance + one function per backend endpoint
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
| `/app/profile`              | Profile       | yes           |
| `/app/preview/:fileId`      | FilePreview   | yes           |
| `/share/:token`             | SharedFile    | no (public)   |
| anything else               | NotFound      | no            |

---

## 4. Architecture & data flow

The app has two providers and one rule.

```
AuthProvider                → who is signed in? (JWT + profile in localStorage)
  └── ProtectedRoute        → gates /app/*, redirects to /login
        └── LibraryProvider → what is in the library? (real API)
              └── AppLayout → sidebar/bottom-nav, upload + new-folder
                             modals, toast stack, <Outlet/>
```

**The rule: all library state flows through `useLibrary()`.** Pages read `files`, `folders`, `uploads`, `sharedLinks` and toasts from the context, and change them only through its actions (`toggleStar`, `trashFiles`, `startUpload`, `createFolder`, …). The context is the only module that talks to `services/api.js` for library data (auth has its own context).

**Loading and errors.** `LibraryProvider` fetches all files + folders once on mount. Screens render skeleton rows while `loading` is true and a retry panel when `error` is set. Every failure message comes from the backend's `{ success, message, data }` envelope via `messageFromError()` — screens never show raw error objects.

**Downloads** go through axios as blobs so the JWT travels in the Authorization header (a plain browser navigation can't send it). Public share links download straight from the public endpoint with no token.

---

## 5. Talking to the backend

All network code lives in `src/services/api.js`:

- one axios instance, base URL from `VITE_API_URL`;
- request interceptor attaches `Bearer <token>` from localStorage;
- response interceptor clears the session and redirects to `/login?expired=1` on 401;
- `messageFromError(err)` / `fieldErrorsFrom(err)` extract the backend's real messages;
- one exported function per endpoint (`login`, `fetchAllFiles`, `createShareLink`, …).

File shapes coming back from the API (`displayName`, `fileType`, `mimeType`, `size`, `createdAt`, `folder`) are mapped onto the UI's `kind`/`updatedAt` expectations inside `LibraryContext`, so components keep the design-system's field names.

---

## 6. Design system

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

## 7. Conventions & gotchas

- **New page?** Create it in `pages/`, add the route in `App.jsx`. If it lives under `/app`, it renders inside `AppLayout` automatically — no chrome to wire up.
- **New component?** Primitives (no domain knowledge) go in `ui.jsx`; everything else gets its own file in `components/`.
- **Styling:** add to `styles.css` under the matching section comment. Keep specificity flat — class selectors, no nesting wars.
- **Dependencies:** the stack is deliberately small. Adding a library needs a reason lucide/Vite/React can't already cover.
- **Exports:** `ui.jsx` and `hooks.js` are barrel-style; import from the module root (`components/ui.jsx`), not deep paths.
- **Honest UI only:** every screen shows real backend data. If a capability isn't implemented server-side, it isn't shown in the UI either.
