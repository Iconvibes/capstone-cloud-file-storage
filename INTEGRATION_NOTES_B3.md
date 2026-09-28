# Integration notes — B3 (file retrieval)

Hi team — these are the issues I hit while integrating and testing my part
(`GET /api/files`, `GET /api/files/:id`, `GET /api/files/:id/download`) against
everyone's merged code on `feature/file-retrieval-b3`.

**Testing context, so the results are reproducible:** with the current merged
code the backend cannot run as-is (issues 1 and 2 below). To verify my own
endpoints I mounted my real `routes/fileRoutes.js` together with the real
`middleware/authMiddleware.js`, `middleware/validate.js`,
`controllers/manageController.js` and `routes/folderRoutes.js` in a test app,
and ran a 39-case suite (list/search/filter/sort/pagination, details, download,
auth, ID validation, cross-user access, invalid params). All 39 cases pass
against my files. Issues 1–4 are what blocks the real app.

---

## 1. `fileRoutes.js` does not exist as a route in the running app — `app.js` mounts `uploadRoutes` at `/api/files` and never mounts `fileRoutes`

- **File:** `backend/src/app.js`
- **Owner:** B1 (auth/foundation)
- **Severity:** blocker for my whole feature

**What is wrong**

Two problems on consecutive lines:

```js
app.use('/api/files', require('./routes/uploadRoutes'));app.use("/api/folders", folderRoutes);
```

- `/api/files` is wired to `uploadRoutes` (which only handles `POST /`, so every
  GET on `/api/files...` falls through to Express's default 404).
- `routes/fileRoutes.js` — the router my task built — is never `app.use`d
  anywhere, so `listFiles`, `getFile` and `downloadFile` are dead code in the
  running app.

**How to reproduce**

1. Start the backend (`npm start` in `backend/`).
2. Register a user, grab the token:
   `curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d '{"name":"T","email":"t@x.com","password":"password123"}'`
3. `curl -i http://localhost:5000/api/files -H "Authorization: Bearer <token>"`
4. Actual: `HTTP/1.1 404 Not Found`, `Content-Type: text/html; charset=utf-8`,
   body is Express's HTML error page — i.e. not our JSON format at all.
   Expected: `200` with `{ "success": true, "message": "Files retrieved", "data": { "files": [...], "pagination": {...} } }`.

**Suggested fix (one line to change, one to add)**

```js
app.use("/api/upload", uploadRoutes);
app.use("/api/files", fileRoutes);   // was: require('./routes/uploadRoutes')
app.use("/api/folders", folderRoutes);
```

(`fileRoutes` is already imported at the top of `app.js` — it's just never used.)
Also consider removing the duplicated `app.use(rateLimit(...))` while in there.

---

## 2. `fileRoutes.js` does not parse — the backend cannot start at all

- **File:** `backend/src/routes/fileRoutes.js`
- **Owner:** B3 (me) — **already fixed on my branch**, listed here for the record
- **Severity:** blocker (app crashes on boot)

**What was wrong**

The merge of my branch with B4's file-management branch left **two complete
versions of the router concatenated** in one file: duplicate `const` requires
(`param` declared twice), my GET routes defined twice (once without
`authMiddleware`), and a placeholder `DELETE /:id` overwriting B4's real one.
`node --check` fails: `SyntaxError: Identifier 'param' has already been
declared`, and `require('./src/app.js')` crashes the process on boot.

**What I did in my file (no one else needs to act)**

Kept one coherent router: my GET routes (with `authMiddleware` + validators +
`validate`) and B4's `PATCH`/`DELETE` routes exactly as the merged block
intended (`manageController.updateFile/deleteFile`), plus the `mongoose` require
that B4's `folder` validator needs.

---

## 3. Database never connects — `.env` key and `config/db.js` disagree

- **File:** `backend/src/config/db.js` (and/or `backend/.env` naming)
- **Owner:** B1 (auth/foundation)
- **Severity:** blocker (every request 500s without a DB)

**What is wrong**

`.env` defines the connection string as `MONGODB_URI`:

```env
MONGODB_URI=...
```

but `config/db.js` reads:

```js
await mongoose.connect(process.env.MONGO_URI);
```

So `process.env.MONGO_URI` is `undefined`, and the app logs:

```
MongoDB connection failed: The `uri` parameter to `openUri()` must be a string, got "undefined".
```

then `process.exit(1)`s. Nobody's endpoints can be tested against the real app
until this is fixed.

**How to reproduce**

1. `cd backend && npm start`
2. See the failure above immediately after "Server running on port ...".

**Suggested fix (pick one)**

- In `config/db.js`: `await mongoose.connect(process.env.MONGODB_URI);` (match
  `.env`), **or**
- rename the key in `.env` / `.env.example` to `MONGO_URI` (and update
  `.env.example` so the next dev doesn't hit this again).

Either is a one-line change. Bonus: `config/db.js` could log *which* env var it
looked for when it's missing, to make this class of bug obvious.

---

## 4. Cloudinary account rejects all uploads — `cloud_name is disabled` (HTTP 401)

- **File:** `backend/src/services/cloudinaryService.js` / Cloudinary account config (not a code bug)
- **Owner:** B2 (upload/File model)
- **Severity:** blocker for B2's upload feature (and for B3's end-to-end upload→download flow)

**What is wrong**

Uploading through B2's endpoint (`POST /api/upload`) fails with a 500. The
server log shows Cloudinary rejecting the request:

```
{ message: 'cloud_name is disabled', name: 'Error', http_code: 401 }
```

The credentials in `.env` point at a Cloudinary cloud that is disabled (likely a
free-tier account that was suspended/disabled, or placeholder credentials).

**How to reproduce**

1. Start the backend (after fixing issues 1–3).
2. `curl -X POST http://localhost:5000/api/upload -H "Authorization: Bearer <token>" -F "file=@some.png"`
3. Actual: `500 {"success":false,"message":"Something went wrong while uploading the file"}`.
   Expected: `201` with the created file document.

**Suggested fix**

Log into the Cloudinary dashboard and check the cloud named in
`CLOUDINARY_CLOUD_NAME`: either re-enable/verify the account, or create a new
cloud and update `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` /
`CLOUDINARY_API_SECRET` in `.env`.

Note for whoever tests end-to-end: until this is fixed, `File` documents can be
created directly in MongoDB (with any reachable `cloudUrl`) to exercise B3's
endpoints — that's exactly how I verified my part; the code paths in
`fileController.js` don't care where `cloudUrl` points.

---

## Minor / informational

### 5. Login rate limiter counts every request against the global limiter (double limiting)

- **File:** `backend/src/app.js`
- **Owner:** B1 (auth/foundation)
- **Severity:** minor

`app.js` applies a global `rateLimit({ windowMs: 15min, limit: 100 })` **twice**
(`app.use(rateLimit(...))` appears two times), and there's also an unused local
`loginLimiter` copy next to the real one in `middleware/rateLimiters.js`. Effect:
each login attempt burns 2 of the 100 requests per IP per 15 min, and the code
is confusing to read. Suggested fix: keep exactly one global limiter and rely on
`loginLimiter` from `middleware/rateLimiters.js` for `/api/auth/login`.

### 6. `app.js` health endpoint does not reflect DB status

- **File:** `backend/src/app.js`
- **Owner:** B1 (auth/foundation)
- **Severity:** informational

`GET /api/health` returns 200 even when the DB connection failed, so
orchestrators/teammates can't distinguish healthy from broken. Suggested: check
`mongoose.connection.readyState === 1` and return 503 otherwise.

### 7. Upload endpoint validates `folderId` shape but not ownership

- **File:** `backend/src/controllers/uploadController.js`
- **Owner:** B2 (upload/File model)
- **Severity:** minor (data-integrity, not a leak of file contents)

`uploadFile` only checks `mongoose.Types.ObjectId.isValid(folderId)` (there's
even a `TODO: confirm with B4` in the code). A user can attach their new upload
to **another user's folder ID**. B3's list endpoint already scopes folder
filtering to the owner (I added that check), so the file would be invisible
under that folder for everyone — but the DB ends up with a file pointing at a
folder it doesn't belong to. Suggested: same pattern as
`manageController.updateFile` — `Folder.findOne({ _id: folderId, owner: req.user._id })`
and reject with 400/404 when not found.

### 8. B2's file-upload probe returned an HTML 404 in my test app

- **File:** none (test-harness artifact, for transparency)
- **Owner:** n/a

In my isolated test app I only mounted auth/files/folders routers, so
`POST /api/upload` correctly answered Express's HTML 404 there. Through the real
`app.js` the endpoint exists and fails with issue 4. No action needed — included
so nobody chases the "Cannot POST /api/upload" line if they re-run my suite.

---

## What I changed in my own files (for the record)

- `backend/src/routes/fileRoutes.js` — resolved the broken merge (issue 2): one
  router, my GET routes authenticated + validated, B4's PATCH/DELETE wired to
  `manageController`.
- `backend/src/controllers/fileController.js` — (a) `?folder=` with an invalid
  ObjectId previously bubbled a Mongo `CastError` → 500 with a raw message; now
  returns a friendly 400; (b) folder filter now verifies the folder belongs to
  the caller (`Folder.findOne({ _id, owner })`), so users can't probe other
  users' folder IDs (404 otherwise); (c) download response now sets
  `Connection: close` and cancels the upstream Cloudinary stream when the
  client disconnects mid-transfer.

## Verification summary (my part)

39/39 automated checks passed, covering: owner-scoped list, search (incl. regex
metacharacters), type filter (image/document/other), folder filter, newest-first
default sort, page/limit + pagination info, out-of-range page, details by ID,
download (exact bytes, `Content-Disposition` filename, content-type, 502 +
friendly message on unreachable storage), no-token/invalid-token 401s, malformed
ID 400, non-existent ID 404, cross-user details/download/folder 404 (no data
leaks), invalid `type` 400, `page=0/-1/abc` defaulting, `limit=999` clamping,
and `{ success, message, data }` shape on every response.
