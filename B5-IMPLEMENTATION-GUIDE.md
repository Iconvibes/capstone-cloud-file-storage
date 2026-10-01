# B5 — File Sharing: How We Built It (Simple Guide)

> A plain-English walkthrough of the file-sharing feature. No jargon required.

---

## 1. What does B5 actually do?

Before B5, a file could only be seen by the person who uploaded it.
**B5 lets you create a link and send it to anyone** — even people with no account.

Imagine you upload `notes.pdf`. You click **Share**, the backend gives you a link
like `http://localhost:3000/share/abc123XYZ`. Anyone who opens that link sees the
file's name and can download it. You can **cancel** the link at any time, or make
it **expire automatically** after a date you choose.

That's the whole feature. Four endpoints do it.

---

## 2. The four endpoints

| # | Method | URL | Who can call it | What it does |
|---|---|---|---|---|
| 1 | `POST` | `/api/files/:id/share` | Only the file owner (logged in) | Creates the shareable link |
| 2 | `DELETE` | `/api/files/:id/share` | Only the file owner (logged in) | Cancels the link |
| 3 | `GET` | `/api/share/:token` | **Anyone**, even logged out | Shows the file's details |
| 4 | `GET` | `/api/share/:token/download` | **Anyone**, even logged out | Downloads the file |

Endpoints **1 and 2** are the "owner controls sharing" side.
Endpoints **3 and 4** are the "person who has the link" side.

---

## 3. What we changed (5 files)

| File | What we did |
|---|---|
| `models/ShareLink.js` | Added one small rule (see §5) |
| `validators/helpers.js` | Added a reusable "must be a future date" check |
| `validators/share.validator.js` | **New file.** The rules for a share link: the token's shape and the expiry date |
| `controllers/shareController.js` | Rewrote it — the 4 endpoints' actual logic |
| `routes/shareRoutes.js` | Rewrote it — the 2 public endpoints |
| `routes/fileRoutes.js` | Added 2 lines to wire up the owner endpoints |
| `README.md` + `docs/postman/…json` | Documentation and a ready-made Postman collection |

That's it. We did **not** touch the upload, folder, login, or file-list code, so
nothing that worked before should behave differently now.

---

## 4. How it works, step by step

### Creating a link (owner clicks "Share")

1. We check the user is logged in and owns the file. Not theirs → **403**.
2. We check for an **existing working link** for this file.
   - If one exists → we hand back the **same link** (status `200`).
     *Why?* So opening the Share dialog twice never spams people with extra links.
   - If none → we make a **new random token** and save it (status `201`).
3. We return the token plus a ready-made `shareUrl` the owner can copy.

### Opening a link (a visitor clicks it)

1. We look up the token in the database.
2. Three possible outcomes:
   - **Found and still valid** → return the file's details (or stream the bytes).
   - **Not found, or the owner cancelled it** → **404**.
   - **Found, but its expiry date has passed** → **410**.
   - Both bad cases send the *same friendly sentence*: *"This link is invalid or
     has expired."* So we never tell a stranger why a link failed.

### Why does a cancelled link stop working instantly?

Because we never actually **delete** the link. We just flip a flag called
`isActive` to `false`. Our code treats "flag is false" exactly like "link doesn't
exist". The old link is then dead for the visitor, and the owner can create a new
one whenever they like. Keeping the row (instead of deleting it) means we have a
small history of what was shared.

---

## 5. The one clever rule we added to the database

We promised: **a file has at most ONE working share link at a time.**

Two ways to keep that promise:
- (a) Trust the code to check carefully.
- (b) **Let the database refuse a second one.**

We did **(b)**. We told MongoDB: *"for any file, only allow one link where the
active flag is `true`."* If two people somehow click Share at the exact same
millisecond, the database blocks the second one — the rule holds **even under
perfectly-timed chaos**. This is why the earlier "re-share after expiry" case
needed a small extra step: an old link that has expired is still flagged active,
so we switch it off *before* creating the new one (otherwise it would block the
new link, and the owner could never share that file again).

---

## 6. Small details we handled (so they don't surprise us later)

| Situation | What we do |
|---|---|
| Owner clicks Share again while a link still works | Return the same link (`200`), don't create a second |
| Old link expired, owner wants to share again | Turn the old one off automatically, then create a fresh link |
| A date in the **past** is sent | Rejected with a clear message (`400`) |
| A nonsense date is sent (e.g. `"tomorrow"`) | Rejected (`400`) |
| No expiry given | The link just never expires |
| Owner cancels a link | Immediate `404` for anyone using it |
| Two clicks land at the same instant | Database blocks the duplicate; both requests get a sensible answer, nothing crashes |
| The file is deleted by its owner | Its links are removed too (done by the earlier delete feature) |
| Cloud storage is down while someone downloads | Friendly **502** "Storage temporarily unavailable" |
| Someone who never logged in visits a link | Works fine — that's the point of the feature |

---

## 7. Privacy choices (deliberate)

When a visitor opens a shared link, they see **only the file itself** — its name,
type, size, when it was created. They do **not** see:
- the owner's name/email,
- the cloud-storage URL behind the scenes,
- any of the owner's other files.

Only someone with the actual link can reach a shared file. The tokens are long
random strings (32 characters of true randomness), which means they can't be
guessed by someone who hasn't been given the link.

---

## 8. How do we know it works?

We wrote an automatic test that starts the app on a **separate** port and a
**separate** database (so it never touches your real data), then tries the whole
story: sign in → upload a real file → share → open the link → download → cancel →
confirm the link dies; plus every wrong-input case (no login, someone else's
file, a bad date, a cancelled link, an expired link, a made-up link). **All 39
checks pass.**

Run it yourself from the `backend/` folder:

```bash
node scripts/smoke-share.js
```

---

## 9. What's next?

The backend is done. The frontend (the team building the screens) needs to:
1. Add a **Share** button on each file that calls the create endpoint and shows
   the returned link to copy.
2. Add a **Cancel share** button.
3. Add a public page at `/share/:token` that calls the two public endpoints and
   shows the file name with a **Download** button — showing the friendly
   "invalid or expired" message when the link doesn't work.

All the exact rules for those screens are written down for them in
`FRONTEND-VALIDATION-GUIDE.md` (§3.11 and §4.8).

---

## 10. In one sentence

*B5 added a "shareable link" to each file: the owner can create, cancel, or
schedule the link to expire; anyone with the link can see the file's details and
download it; and a database-level rule guarantees a file never has two working
links at once.*

---

_Documentation written by the backend team (B5). Questions? Ask before changing
anything in the sharing code — the "only one active link" rule is enforced by the
database, so removing it means editing the model, not just the controller._