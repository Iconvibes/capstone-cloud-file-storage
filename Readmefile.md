# API Documentation — Cloud File Storage App

Base URL (local): `http://localhost:<PORT>/api`

All responses follow this shape:

```json
{ "success": true, "message": "...", "data": { } }
```

or on error:

```json
{ "success": false, "message": "...", "data": null, "errors": [ ] }
```

(`errors` is only present on validation failures; every other error carries `data: null` so the shape stays identical.)

## Health

### GET /api/health

Liveness check — no auth. Useful for uptime monitors.

- `200` — `{ "success": true, "message": "...", "data": null }`

## Authentication

Protected routes require a JWT in the `Authorization` header:

```
Authorization: Bearer <token>
```

Get a token from `/auth/register` or `/auth/login`. If the token is missing, invalid, expired, or belongs to a deleted user, the API returns `401`.

---

## Auth

### POST /api/auth/register

Create a new account.

**Auth required:** No

**Body (JSON):**

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| name | String | Yes |  |
| email | String | Yes | Must be a valid email format |
| password | String | Yes | Minimum 8 characters |

**Responses:**

- `201` — Account created. Returns `{ user: { id, name, email }, token }`
- `400` — Missing fields / invalid email / password too short
- `409` — Email already in use

---

### POST /api/auth/login

Log in and receive a JWT.

**Auth required:** No **Rate limited:** Yes (`loginLimiter` — repeated failed attempts will be throttled)

**Body (JSON):**

| Field | Type | Required |
| --- | --- | --- |
| email | String | Yes |
| password | String | Yes |

**Responses:**

- `200` — Returns `{ user: { id, name, email }, token }`
- `400` — Missing email or password
- `401` — Invalid email or password

---

### GET /api/auth/me

Get the currently logged-in user's profile.

**Auth required:** Yes

**Responses:**

- `200` — Returns `{ id, name, email }`
- `401` — Not authorized

---

## Files

### GET /api/files

List the logged-in user's files. Supports search, filtering, and pagination.

**Auth required:** Yes

**Query parameters (all optional):**

| Param | Type | Notes |
| --- | --- | --- |
| search | String | Case-insensitive partial match on display name |
| type | String | One of: `image`, `document`, `other` |
| folder | String | Mongo ObjectId — restrict to one folder |
| page | Number | Whole number, 1–1,000,000. Defaults to 1 if omitted |
| limit | Number | Whole number, 1–50. Defaults to 10 if omitted |

**Responses:**

- `200` — Returns `{ files: [...], pagination: { page, limit, total, totalPages } }`
- `400` — Invalid `type`, `folder`, `page`, or `limit` (e.g. out of range, not a whole number)

---

### GET /api/files/:id

Get a single file's metadata.

**Auth required:** Yes

**Responses:**

- `200` — Returns the file document
- `400` — Invalid file ID format
- `404` — File not found (also returned if the file belongs to another user)

---

### GET /api/files/:id/download

Download the file as an attachment. Streams directly from Cloudinary; supports HTTP Range requests for partial downloads.

**Auth required:** Yes

**Responses:**

- `200` — Full file stream
- `206` — Partial content (when a `Range` header is sent and honored)
- `400` — Invalid file ID format
- `404` — File not found / not owned by you
- `416` — Requested range not satisfiable
- `502` — Cloud storage unavailable or file has no valid `cloudUrl`

---

### PATCH /api/files/:id

Rename a file and/or move it to a different folder.

**Auth required:** Yes

**Body (JSON, at least one field required):**

| Field | Type | Notes |
| --- | --- | --- |
| displayName | String | 1–100 characters after trimming |
| folder | String / null | Valid folder ID you own, or `null` to remove from folder |

**Responses:**

- `200` — Returns the updated file
- `400` — Invalid file ID / empty display name / invalid folder ID / nothing to update
- `403` — You don't own this file
- `404` — File not found, or target folder not found/not yours

---

### DELETE /api/files/:id

Delete a file. Also deletes any share links pointing to it and removes it from Cloudinary.

**Auth required:** Yes

**Responses:**

- `200` — File deleted
- `400` — Invalid file ID format
- `403` — You don't own this file
- `404` — File not found

---

### POST /api/files/:id/share

Create a shareable link for one of your files. If an active, unexpired link already exists for this file, that same link is returned instead of creating a duplicate.

**Auth required:** Yes

**Body (JSON, optional):**

| Field | Type | Notes |
| --- | --- | --- |
| expiresAt | Date / null | When the link should stop working. Must be a future date if provided. Omit or send `null` for a link that never expires. |

**Responses:**

- `201` — New link created. Returns `{ token, shareUrl, expiresAt, isActive }`
- `200` — An active link already existed; the existing link is returned in the same shape
- `400` — `expiresAt` is not a valid date, or is not in the future
- `403` — You don't own this file
- `404` — File not found

---

### DELETE /api/files/:id/share

Revoke the active share link(s) for one of your files. Idempotent — calling this with no active link still returns `200`.

**Auth required:** Yes

**Responses:**

- `200` — Link revoked (or there was nothing to revoke)
- `403` — You don't own this file
- `404` — File not found

---

## Upload

### POST /api/upload

Upload a new file, optionally into a folder.

**Auth required:** Yes **Content-Type:** `multipart/form-data`

**Body (form-data):**

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| file | File | Yes | Any file type (images, video, audio, documents, archives, executables, unknown types…). Max size: 100 MB. Contents are checked for known threat signatures before storage |
| folderId | String | No | Must be a valid folder ID belonging to the logged-in user |

**Responses:**

- `201` — Returns the created file document
- `400` — No file selected / invalid folder ID format / file too large (max 100 MB) / file blocked by the safety check (known threat signature)
- `404` — Folder not found (or belongs to another user)
- `500` — Unexpected server/upload error

---

## Folders

### GET /api/folders

List the logged-in user's folders, newest first.

**Auth required:** Yes

**Responses:**

- `200` — Returns `{ folders: [...] }`

---

### POST /api/folders

Create a new folder.

**Auth required:** Yes

**Body (JSON):**

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| name | String | Yes | 1–100 characters, must be unique per user (case-insensitive) |

**Responses:**

- `201` — Returns the created folder
- `400` — Name missing/empty or too long
- `409` — You already have a folder with this name

---

### DELETE /api/folders/:id

Delete a folder. Files inside it are **not** deleted — they're moved to no folder (`folder: null`).

**Auth required:** Yes

**Responses:**

- `200` — Folder deleted
- `400` — Invalid folder ID format
- `403` — You don't own this folder
- `404` — Folder not found

---

### PATCH /api/folders/:id

Rename a folder.

**Auth required:** Yes

**Body (JSON):**

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| name | String | Yes | 1–100 characters, must be unique per user (case-insensitive) |

**Responses:**

- `200` — Returns the renamed folder
- `400` — Name missing/empty or too long, or invalid folder ID format
- `403` — You don't own this folder
- `404` — Folder not found
- `409` — You already have a folder with this name

---

## Sharing

A file can have at most one **active** share link at a time (enforced at the database level). Revoked links are kept as history rather than deleted. Creating and revoking a link is owner-only and lives under `/api/files` (see above); consuming a link is public and lives under `/api/share`.

### GET /api/share/links

List the signed-in user's own active share links, newest first, each with the shared file's display details.

**Auth required:** Yes

**Responses:**

- `200` — Returns `{ links: [{ _id, token, expiresAt, createdAt, file: { _id, displayName, size, ... } }] }`
- `401` — Not authorized

---

### GET /api/share/:token

Public. View a shared file's metadata using its share token. Does not require login, and never exposes the owner or the underlying cloud storage URL.

**Auth required:** No

**Responses:**

- `200` — Returns `{ id, displayName, originalName, fileType, mimeType, size, createdAt, expiresAt }`
- `400` — Token is malformed (wrong characters or length)
- `404` — Token doesn't exist or has been revoked
- `410` — Link exists but has expired

---

### GET /api/share/:token/download

Public. Download the shared file's bytes directly, using its share token. Supports HTTP Range requests, same as the authenticated download route.

**Auth required:** No

**Responses:**

- `200` — Full file stream
- `206` — Partial content (Range header honored)
- `400` — Token is malformed (wrong characters or length)
- `404` — Token doesn't exist or has been revoked
- `410` — Link exists but has expired
- `416` — Requested range not satisfiable
- `502` — Cloud storage unavailable or file has no valid `cloudUrl`