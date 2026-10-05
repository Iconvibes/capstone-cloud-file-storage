# CloudFileStorageApp Backend

Express and Mongoose API for CloudFileStorageApp — a cloud file storage application.

Run `npm install`, copy `.env.example` to `.env`, and start with `npm run dev` or `npm start`.

## Response envelope
Every endpoint replies with:
```json
{ "success": true, "message": "...", "data": <payload> }
```
Errors use `{ "success": false, "message": "...", "data": null }` and, for validation failures, an extra `errors` array of `{ param, msg, location }` items.

## Shared helpers
- `utils/apiResponse.js` — `successResponse` / `errorResponse` (use for all responses)
- `middleware/authMiddleware.js` — protects routes, sets `req.user`
- `middleware/validate.js` — zod-based validation (`validate({ body, query, params })`)
- `validators/` — one zod schema module per feature

## Auth endpoints (B1)
| Endpoint | Method | Auth | Description |
|---|---|---|---|
| /api/auth/register | POST | No | Create account (returns JWT) |
| /api/auth/login | POST | No | Log in, returns JWT |
| /api/auth/me | GET | Bearer token | Get logged-in user |

## File upload (B2)
| Endpoint | Method | Auth | Description |
|---|---|---|---|
| /api/upload | POST | Bearer token | Upload one file (multipart field `file`, optional `folderId`) |

## Files (B3 + B4 management)
| Endpoint | Method | Auth | Description |
|---|---|---|---|
| /api/files | GET | Bearer token | List own files (filters: `search`, `type`, `folder`; pagination: `page`, `limit`) |
| /api/files/:id | GET | Bearer token | Get one file's details |
| /api/files/:id/download | GET | Bearer token | Stream own file as attachment (supports `Range`) |
| /api/files/:id | PATCH | Bearer token | Rename file / move to folder (`displayName`, `folder` or `null`) |
| /api/files/:id | DELETE | Bearer token | Delete file + its cloud asset + share links |

## Folders (B4)
| Endpoint | Method | Auth | Description |
|---|---|---|---|
| /api/folders | GET | Bearer token | List own folders |
| /api/folders | POST | Bearer token | Create folder |
| /api/folders/:id | PATCH | Bearer token | Rename folder (`name`, 1–100 chars) |
| /api/folders/:id | DELETE | Bearer token | Delete folder |

## File sharing (B5)
| Endpoint | Method | Auth | Description |
|---|---|---|---|
| /api/share/links | GET | Bearer token | List your own active share links (with file details) |
| /api/files/:id/share | POST | Bearer token (owner) | Create a shareable link. One active link per file; repeat calls return the existing link. Body: optional `expiresAt` (ISO date in the future; omit / `null` / `""` = permanent) |
| /api/files/:id/share | DELETE | Bearer token (owner) | Revoke the file's active share link(s) |
| /api/share/:token | GET | No (public) | Get shared file's details (name, type, size — no owner / cloud info). `404` invalid/revoked, `410` expired |
| /api/share/:token/download | GET | No (public) | Download the shared file. `404` invalid/revoked, `410` expired, `502` storage unavailable |

Share creation returns:
```json
{ "success": true, "message": "Shareable link created", "data": { "token": "...", "shareUrl": "http://localhost:3000/share/<token>", "expiresAt": null, "isActive": true } }
```

## Validation
All endpoints validate via zod (`middleware/validate.js`). Invalid input returns `400` with a list of `{ param, msg, location }` errors. Emails are trimmed/lowercased; passwords need 8+ characters with at least one letter and one number; ObjectIds must be 24-character hex strings; pagination is capped (`limit` ≤ 50).

## Testing

## Status
B1 (auth), B2 (upload), B3 (file retrieval), B4 (folders/management) and B5 (file sharing) complete and tested.