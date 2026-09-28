# Notes from B3 about what is broken (easy-read version)

Hi team 👋

I finished building and testing my part (viewing, searching, and downloading
files). My part works — I tested it 39 different ways and everything passed.

But when I put my code together with everyone else's, I found some problems in
other parts of the app. Because of these problems, **the app cannot run at all
right now**. This file explains each problem in simple words, who needs to fix
it, and how.

---

## Problem 1: My file pages are not connected to the app (fix by B1)

**Where:** `backend/src/app.js`
**Who:** B1

**The problem, in plain words:**
Think of `app.js` like a receptionist that sends visitors to the right desk.
The receptionist sends anyone asking for "files" to the **upload desk** instead
of **my desk**. And my desk (`fileRoutes.js`) was never plugged in at all.

So when someone opens their file list, the app says "page not found" — even
though my code is sitting right there, finished and working.

**How to see it yourself:**
1. Start the app.
2. Make a user account and copy the token it gives you.
3. Open the files list address (`/api/files`) with that token.
4. You get an ugly "Cannot GET" page instead of the file list.

**The fix (one line):**
In `app.js`, change the line that connects "files" to the upload code so it
connects to my file code instead:

```js
app.use("/api/files", fileRoutes);
```

(The import for `fileRoutes` is already at the top of the file — it's just
never used.)

---

## Problem 2: Two copies of the same file got merged together (already fixed by me)

**Where:** `backend/src/routes/fileRoutes.js`
**Who:** me (B3) — **no action needed, just for the record**

**What happened:**
When the branches were merged, my version of the file and B4's version got
pasted into one file, one after the other. The app crashed the moment it
started because the same things were written twice.

**What I did:**
I cleaned up my own file so it has one clean copy of everything: my
view/search/download routes, plus B4's rename/delete routes, all working
together. Done and tested.

---

## Problem 3: The app cannot find the database (fix by B1)

**Where:** `backend/src/config/db.js` (and the `.env` file name)
**Who:** B1

**The problem, in plain words:**
The settings file (`.env`) saves the database address under the name
`MONGODB_URI`. But the code looks for a name called `MONGO_URI`. Different
name, so the code finds nothing, says "database address is missing," and the
whole app shuts down.

**How to see it yourself:**
1. Start the app.
2. Right away you see: "MongoDB connection failed... got undefined".

**The fix (one line):**
Make both names the same. Either:
- change the code in `db.js` to read `MONGODB_URI` (what the settings file
  already uses), **or**
- rename the line in `.env` to `MONGO_URI`.

Pick one and tell everyone which name is the official one, so this doesn't
happen again. (Also update `.env.example` to match.)

---

## Problem 4: Our Cloudinary account is turned off (fix by B2)

**Where:** the Cloudinary account itself / the keys in `.env`
**Who:** B2

**The problem, in plain words:**
Every upload fails. The reason is not the code — Cloudinary itself is saying
"this account is disabled". Our login keys in `.env` point to a cloud account
that is switched off (maybe it ran out or got suspended).

**How to see it yourself:**
1. Start the app and log in.
2. Try to upload any file.
3. Upload fails with "Something went wrong", and in the app's black window you
   see: `cloud_name is disabled`.

**The fix:**
1. Log in to the Cloudinary website and check the account.
2. Either turn the account back on, or make a new one.
3. Put the new keys (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
   `CLOUDINARY_API_SECRET`) into `.env`.

**Good to know:** while the account is off, the rest of the team can still test
their parts by putting file records straight into the database by hand. That's
how I tested mine.

---

## Small problems (not urgent, but should be cleaned up)

**5. The "too many requests" block is counted twice (B1, `app.js`).**
The same limit rule is added to the app two times. So every request uses up two
turns instead of one, and users hit the limit twice as fast. Keep it once.

**6. The health check lies (B1, `app.js`).**
The "is the app ok?" address (`/api/health`) says "all good" even when the
database is down. It should say "not ok" when the database is off.

**7. Upload lets files go into someone else's folder (B2, `uploadController.js`).**
When uploading, the code only checks that the folder's ID *looks* correct — not
that the folder belongs to you. So you can hang your file on another person's
folder. B2 already left a note (`TODO`) in the code about this. The fix: check
the folder belongs to the logged-in user before saving the file there.

---

## What I changed in my own files (just so everyone knows)

- `fileRoutes.js` — cleaned up the merged mess (Problem 2).
- `fileController.js` — three small safety improvements:
  - a wrong folder ID now gives a friendly "not valid" message instead of a
    scary error;
  - you can only list files inside **your own** folders, so nobody can peek at
    other people's folders;
  - when someone stops a download halfway, we stop pulling the file from
    Cloudinary too, instead of leaving it running.

## What I tested (and it all passed)

39 checks in total: listing files, searching, filtering by type and folder,
newest-first order, page sizes, single file view, downloading (the downloaded
file matches the original, byte for byte, with the right name), wrong or missing
login tokens, wrong IDs, trying to open another user's files (blocked, no
leaking), and every reply following our standard `{ success, message, data }`
shape.

**Bottom line:** my part is done and tested. Once B1 fixes Problems 1 and 3, and
B2 fixes Problem 4, the whole flow should work end to end.
