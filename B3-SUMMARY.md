# B3 — File Retrieval (List, Search, Filter, Pagination & Download) — Summary

## What I built

Three endpoints, all under `GET /api/files` and all protected by the shared JWT auth middleware:

1. **`GET /api/files`** — lists only the logged-in user's own files, with optional
   `search`, `type`, and `folder` filters plus `page`/`limit` pagination.
2. **`GET /api/files/:id`** — returns the full details of one file, but only if it
   belongs to the logged-in user.
3. **`GET /api/files/:id/download`** — streams the user's own file from cloud
   storage, forcing the browser to save it under the file's original display name.

The only two files I changed are `backend/src/controllers/fileController.js` and
`backend/src/routes/fileRoutes.js`. Everything else I read and left untouched.

## How I built it

### Listing files (the list endpoint)

The heart of the endpoint is one MongoDB query built from the logged-in user's
identity. The `owner` condition comes from `req.user._id`, which the auth
middleware sets after verifying the JWT — never from anything the client sent.
That single decision guarantees a user can never see anyone else's files, no
matter what query parameters they pass.

The optional filters just add conditions onto that same query object:

- `search` — case-insensitive partial match on the file's display name.
- `type` — exact match on the file's category (image / document / other).
- `folder` — exact match on the folder's ID.

Pagination works with Mongo's `skip` and `limit`. I fetch the matching total
count and the current page of results in parallel (two queries fired together)
and return both in the response's `pagination` block: current page, limit, total
matching files, and total pages. Sort order is always newest first
(`createdAt` descending).

### Getting one file (the detail endpoint)

One query: find the file where the ID matches **and** the owner is the logged-in
user. If nothing comes back, it's a 404. If it does come back, it's the user's
own file and we return it. There is no separate "does the file exist, then does
it belong to me?" dance — the ownership check is baked into the query itself.

### Downloading a file (the download endpoint)

Same ownership-scoped lookup as the detail endpoint. Once we have the file
record, we don't download the file onto our server and re-serve it — that would
waste memory and double the bandwidth. Instead we fetch it from the stored cloud
URL and **pipe the stream straight through** to the client: bytes flow from
cloud storage, through our server, to the browser without ever being fully
buffered. (Node's fetch gives back a "web" stream, so I convert it to a Node
stream with `Readable.fromWeb` before piping — a small but important detail.)

Before streaming, we set two headers:

- `Content-Disposition: attachment; filename="..."` — this is what forces the
  browser to save the file instead of displaying it, and it carries the file's
  friendly display name (e.g. `holiday-report.pdf`) instead of whatever random
  string the cloud storage uses internally.
- `Content-Type` from the stored mime type, so the OS knows how to open it.

Two extra touches: if the client sends a `Range` header (partial download /
resume), we forward it and pass back the `206 Partial Content` status; and if
the client disconnects mid-download, we destroy the upstream stream so we stop
pulling bytes from cloud storage nobody is receiving.

## Why I made the choices I made

### 403 vs 404 for files that aren't yours — I chose 404

The brief asked me to pick one and defend it. I picked **404 for everything:
missing files AND files owned by someone else**.

The reason is information leakage. Imagine Alice sends Bob the link
`/api/files/abc123` and Bob gets a **403** back. Bob now knows something
important: "a file exists at that ID, it's just not mine." File IDs are long
random strings, but URLs get shared, logged, and guessed all the time — a 403
turns the endpoint into a free "does this file exist?" oracle. With 404, every
failure looks identical: the endpoint simply behaves as if the file isn't there.
The user has no way to distinguish "doesn't exist" from "exists but isn't
yours," which is exactly the property a private-files system should have.

The trade-off, to be fair: a 403 is friendlier when a user *knows* they own a
file and something is broken (e.g. a stale ID after an account merge). In our
app that situation shouldn't occur — ownership never transfers — so hiding
existence wins.

### Pagination defaults instead of errors

The brief says invalid `page`/`limit` values should be silently corrected, not
rejected. So `?page=0`, `?page=abc`, or `?page=-1` all behave as `page=1`, and
the same happens for `limit` (defaulting to 10). `?limit=100` gets clamped to
the maximum of 50.

Why clamp instead of erroring? Because these numbers come from a pagination
widget, not from something the user typed by hand. A page number that's too high
(e.g. bookmarked page 9 after the list shrank) just returns an empty page with
correct totals — a natural, expected answer. And the cap matters for the
database: without it, one request with `?limit=999999` would try to serialize a
huge result set and hammer both Mongo and our JSON layer.

### Validation: B1's middleware, reject-bad-IDs-early

I used the exact validation pattern already in the codebase — `express-validator`
rules plus B1's shared `validate` middleware — rather than inventing my own.
Route params and query strings are checked *before* any controller code or
database call runs:

- A malformed `:id` (e.g. `/api/files/hello`) is rejected with **400** before it
  can ever reach Mongo. (A garbage string would otherwise make the Mongo driver
  throw a cast error — an ugly 500 — and casting user input into query keys is
  also an injection smell.)
- `type` is restricted to `image | document | other` (400 otherwise), and
  `folder` must be a well-formed ID.

`page` and `limit` are deliberately NOT validated this way — per the brief they
are corrected in the controller instead of rejected.

One more hardening detail: the `search` term has its regex special characters
escaped before being used in Mongo's `$regex`. Without that, searching for a
file literally named `report (v2)` would either crash the query (invalid regex)
or accidentally act as a pattern. With escaping, users search for exactly what
they type.

### Responses: only through the shared helpers

Every response — success or error — goes through B1's `successResponse` /
`errorResponse` helpers, so the whole API speaks one consistent JSON shape. No
raw `res.json` calls in my code, and no stack traces or driver errors ever reach
the client: unexpected errors are passed to the central error handler, which
logs them server-side and answers with a generic message.

### The download filename is sanitized

The filename goes into an HTTP header, so I strip everything outside printable
ASCII (which also removes newlines — the classic header-injection trick) plus
quotes and backslashes, falling back to the original name if nothing survives.
The 40 test requests I ran included a file named `report (v2) [draft] (1) + 42.txt`
and it downloads with its name fully intact.

## Testing

I tested all of it end-to-end over real HTTP against the real app, with two
temporary test users and 23 seeded files (plus a local stub "cloud storage" so
downloads had real bytes to stream): **42 checks, all passing**, covering:

- No token / invalid token on every route → 401
- Listing with no filters: only the owner's files, newest first, default page 1
  / limit 10, correct totals and page count
- Search: case-insensitive partial match; special characters matched literally
- Type filter (plus invalid type → 400); folder filter (plus malformed folder →
  400 and valid-but-empty folder → empty list)
- Pagination: page 2, limits at the boundary, `limit=100` clamped to 50,
  invalid page/limit values falling back to defaults
- All filters combined in one request
- Detail: own file → 200; another user's file → 404; malformed ID → 400;
  valid-but-missing ID → 404
- Download: own file → 200 with correct `Content-Disposition` filename and
  exact byte count; Range request → 206 with `Content-Range`; foreign file →
  404; missing file → 404; malformed ID → 400; dead cloud URL → clean 502
  error, no crash

All test users, files, and scratch scripts were deleted afterwards — the repo
and database contain nothing test-related.

## One thing for B1 (reported, not fixed — outside my scope)

`app.js` builds the file routes but never mounts them, so the endpoints aren't
reachable yet. The fix is one line, next to the other route mounts:

```js
app.use("/api/files", fileRoutes);
```

(There is also a stray line mounting `uploadRoutes` at `'/api/files'` on the
same line as the folders mount — removing that duplicate is what makes the
above work. My test run temporarily simulated exactly this mount at runtime,
which is how all 42 checks passed.) Details are in `B3-BLOCKERS.md`.
