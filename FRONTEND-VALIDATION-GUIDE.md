# Backend Validation Guide (for the Frontend Developers)

> Read this before wiring the React app to the real backend API.
> It explains **what the backend now validates**, **how errors come back**, and
> **exactly what you need to align** so the frontend and backend agree.

---

## 1. What changed (in one minute)

The backend now validates every request **server-side** with [Zod](https://zod.dev)
inside a single middleware (`backend/src/middleware/validate.js`), with all rules
defined in `backend/src/validators/`.

- Before: some checks lived inside controllers, some used another library, some
  didn't exist.
- Now: **the backend is the single source of truth.** Frontend validation is a
  convenience for good UX — it can never "protect" you from a bad request.

**The golden rule:** any request that doesn't match the rules below is rejected
with **HTTP 400** and a predictable error body — *before* any database work.

---

## 2. The error format you will receive

Every success looks like:

```json
{ "success": true, "message": "…", "data": { } }
```

Every validation failure looks like:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "param": "password", "msg": "Password must be at least 8 characters", "location": "body" },
    { "param": "password", "msg": "Password must contain at least one number", "location": "body" }
  ]
}
```

- `errors` is an **array of objects**: `{ param, msg, location }`.
- One field can produce **more than one** error (see `password` above).
- For a friendly UI: show `message` in a toast, and use `errors[].param` +
  `errors[].msg` to highlight individual fields (e.g. `param === "password"`).

There can be **multiple locations**: `body`, `query`, or `params`.

---

## 3. Rules per endpoint

> `ObjectId` means a MongoDB id: a 24-character hex string, e.g. `64b0…`.

### 3.1 Register — `POST /api/auth/register`

| Field | Rule |
|---|---|
| `name` | trimmed; **2 – 50 characters** |
| `email` | valid email; server **trims and lowercases** it |
| `password` | **at least 8 characters**, with **at least one letter** and **at least one number** |

- If the email is already registered → **409** `message: "Email already in use"` (not a 400).
- The response echoes the email in its normalized (lowercase) form.

### 3.2 Login — `POST /api/auth/login`

| Field | Rule |
|---|---|
| `email` | valid email; server trims and lowercases it |
| `password` | required (non-empty) |

- Wrong email or password → **401** `message: "Invalid email or password"`.
- There is a login rate-limit (5 attempts / 15 min per IP) → **429** "Too many login attempts".

### 3.3 Get current user — `GET /api/auth/me`

No body/query to validate. Needs `Authorization: Bearer <token>` → else **401**.

### 3.4 Create folder — `POST /api/folders`

| Field | Rule |
|---|---|
| `name` | trimmed; **1 – 100 characters** |

- Duplicate folder name for the **same user** → **409** "Folder with this name already exists".

### 3.5 Delete folder — `DELETE /api/folders/:id`

| Field | Rule |
|---|---|
| `:id` | must be a valid `ObjectId` |

- Valid but not your folder / missing → **404**. Not a valid id → **400**.

### 3.6 List/search files — `GET /api/files`

All query params are **optional**. Send them only when you use them.

| Param | Rule | Notes |
|---|---|---|
| `search` | text, 1+ chars | `?search=` (empty) is treated as "not provided" — **it is fine** |
| `type` | one of `image`, `document`, `other` | anything else → 400 |
| `folder` | valid `ObjectId` | empty treated as "not provided" |
| `page` | whole number, **1 – 1,000,000** | strings like `?page=3` are accepted (coerced) |
| `limit` | whole number, **1 – 50** | default is 10 |

- Response shape: `data.files` (array) + `data.pagination` (`{page, limit, total, totalPages}`).

### 3.7 Get / download file — `GET /api/files/:id` and `GET /api/files/:id/download`

- `:id` must be a valid `ObjectId` → else **400**.
- Not your file / missing → **404**. Storage problems → **502**; a range that
  doesn't exist on the stored file → **416**.

### 3.8 Rename / move file — `PATCH /api/files/:id`

| Field | Rule |
|---|---|
| `:id` | valid `ObjectId` |
| `displayName` | optional; trimmed; **1 – 100 characters** |
| `folder` | optional; a valid `ObjectId` **or `null`**; see note |

**Important:** to move a file **to the root (home) folder**, send `folder: null`.
Do **not** send `""` — an empty string is rejected (400). If `folder` is omitted,
the file keeps its current folder.

- Sending an update with no valid change → **400** ("Nothing to update").
- Moving to a folder that doesn't exist or isn't yours → **400** ("Target folder not found").
- File not yours / missing → **404 / 403**.

### 3.9 Delete file — `DELETE /api/files/:id`

- `:id` must be a valid `ObjectId` → else **400**. Not your file → **404**.

### 3.10 Upload — `POST /api/upload` (multipart/form-data)

| Field | Rule |
|---|---|
| `file` | required. Type/size limits enforced too (400 for "File type not allowed", "File is too large") |
| `folderId` | **optional**; a valid `ObjectId`. When no folder is chosen, **omit it or send `""`** — both are accepted |

- Success → **201** with the created file document.
- "No file selected" → **400** when `file` is missing.

---

## 4. Checklist of things to align in the frontend

### 4.1 MUST fix: password rule mismatch (affects real users today)

- Your `Register.jsx` currently checks `password.length >= 6` and the hint says
  **"At least 6 characters"** / **"Mixed case or a number"**.
- The backend requires **at least 8 characters + a letter + a number**.
- Result: users typing e.g. `abcdefgh` pass your check, then hit a backend 400
  your page currently swallows (it shows a generic "We couldn't create the
  account.").
- **Fix:** change the hint to **"At least 8 characters, with a letter and a
  number"** and check in `submit()`:
  - `password.length >= 8`
  - `/[a-zA-Z]/.test(password)`
  - `/[0-9]/.test(password)`
  - Mirror this in the `PasswordField` hint and the `.pw-checklist` items.

### 4.2 Surface the server's message instead of a generic one

`Register.jsx` and `Login.jsx` catch the error but **ignore what the server
said**. Recommend:
- `catch (err) { setError(err.response?.data?.message ?? "Try again.") }`
- For per-field feedback, loop through `err.response?.data?.errors` and match on
  `errors[].param`.

This turns confusing 400s (weak password, empty search value mistakes, etc.)
into useful messages automatically.

### 4.3 Register/Login email

- The server lowercases the email on **both** register and login. If you save the
  email locally (e.g. in `localStorage`), store the **response value**, not what
  the user typed.
- No other frontend rule needed — server validates format.

### 4.4 409s are not validation errors (handle them as UI messages)

- Duplicate email → `409` "Email already in use".
- Duplicate folder name → `409` "Folder with this name already exists".
- Show these as friendly inline messages; do **not** send the request repeatedly.

### 4.5 Navigating folders / moving files

- Create folder: name **1–100** chars; show a character counter if you like.
- Rename (`displayName`): **1–100** chars.
- Move to root: send `folder: null` (JSON) — **never** `""`.

### 4.6 Search / list query params

- You can send an empty `search=` — backend treats it as "no filter". You may
  also omit it entirely.
- Only send `type`, `folder`, `page`, `limit` with values that match the table
  in §3.6. Malformed values (e.g. `page=abc`, `limit=999`) → 400.

### 4.7 Upload form

- Send `folderId` as a form field only when a folder is chosen; otherwise omit it
  (or send `""`, which is the standard way HTML forms encode an empty select).
- File size/type errors (400) should map to friendly copy: "File type not
  allowed", "File is too large", "No file selected".

---

## 5. Status-code cheat sheet (backend → your handling)

| Status | Meaning | Suggested frontend handling |
|---|---|---|
| `400` | Validation failed (see `errors[]`) | Highlight fields / show `message` |
| `401` | Not logged in / bad credentials | Route to login; show "Invalid email or password" |
| `403` | Logged in but not the owner | Show "You don't have access to this" |
| `404` | Not found (bad id that is validly formatted) | Show "Not found" |
| `409` | Duplicate (email / folder name) | Show friendly duplicate message |
| `429` | Rate-limited (login 5/15min) | Show "Too many attempts, wait a bit" |
| `416` | Requested file range not available (download) | Show "That section of the file isn't available" |
| `502` | File storage unavailable (download) | Show "Storage temporarily unavailable" |
| `500` | Server error (e.g. Cloudinary not configured) | Show generic "Something went wrong" |

---

## 6. Where the code lives (if you want to read it)

```
backend/src/
├── validators/            ← all rules
│   ├── helpers.js         ← ObjectId / name rules / query helpers
│   ├── auth.validator.js  ← register + login
│   ├── folder.validator.js← folders
│   └── file.validator.js  ← files list/patch/upload
├── middleware/validate.js ← the middleware that applies the rules
└── routes/…               ← each route lists which schema(s) it uses
```

`Share` endpoints (`/api/share`) will follow the same pattern when the sharing
feature (B5) is built — expect the same error format there.

---

_If a rule here and the code ever disagree, the code wins — tell the backend
team and update this guide._