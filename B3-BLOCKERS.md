# B3 — Issues I hit in other people's areas

I was testing the file listing/detail/download endpoints and ran
into three things that aren't in my files. I didn't touch anyone's code, I just
worked around them in my own throwaway test setup so I could finish testing.
Here's what I found, in plain language:

---

## 1. The file endpoints aren't actually reachable yet (B1 — `app.js`)

**What I was trying to test:** Everything. My routes live in `fileRoutes.js`,
but a route file on its own does nothing — it has to be "mounted" in the main
`app.js` so the server knows that `/api/files` should use it.

**What actually happened instead:** Requests to `/api/files` came back with
Express's default "Cannot GET" HTML page instead of my endpoints.

**Why I'm sure it's not my code:** `app.js` already *imports* `fileRoutes` at
the top, so B1 clearly meant to mount it — the `app.use` line just never made
it in. Worse, there's a stray line in `app.js` that mounts the *upload* routes
at `/api/files` (glued onto the same line as the folders mount), so even the
mount that exists points at the wrong place.

**What B1 should check or fix:** In `app.js`, delete the stray
`app.use('/api/files', require('./routes/uploadRoutes'));` bit and add:

```js
app.use("/api/files", fileRoutes);
```

One line, right next to the other route mounts. Until that's in, my endpoints
exist but are unreachable for everyone.

---

## 2. The app won't even start with the current `.env` (B1 — `config/db.js`)

**What I was trying to test:** Anything at all — the server has to boot first.

**What actually happened instead:** The server crashed on startup with
something like "The `uri` parameter to `openUri()` must be a string, got
undefined". Basically: the database-connection code looked for a setting that
isn't there.

**Why I'm sure it's not my code:** I don't own `config/db.js` or `.env`, and
the mismatch is between those two files. `config/db.js` reads an environment
variable called **`MONGO_URI`**, but our `.env` file defines it as
**`MONGODB_URI`** (one letter different). The names don't match, so the code
gets `undefined`.

**What B1 should check or fix:** Either rename `MONGODB_URI` to `MONGO_URI` in
`backend/.env` (and `.env.example`), or change `config/db.js` to read
`process.env.MONGODB_URI` — whichever you prefer, they just need to say the
same thing. (For my own testing only, my throwaway test script copied the value
across inside its own process; nothing in the repo was changed.)

---

## 3. Loading the upload controller can crash the whole app (B4 — `uploadController.js`)

**What I was trying to test:** My endpoints while the app was fully loaded
(that's the normal way it runs in production).

**What actually happened instead:** The server crashed with "Cannot overwrite
`File` model once compiled". It happens because two different files ask for the
File model in two different ways, and on Windows the second one re-runs the
model definition instead of reusing it.

**Why I'm sure it's not my code:** The problem is in *how* `uploadController.js`
imports things, which is B4's file. The line `require('../models/file')` uses a
lowercase "f", while the actual file is `File.js` with a capital F. On
case-sensitive systems (most servers) that exact spelling doesn't match any
file, and on Windows it can load the *same* file a second time under a
different name — and registering the same model twice is a crash. There's a
couple of similar slips in that file (it imports `uploaadToCloudinary` with
three a's, and uses the response helpers in the wrong argument order), so I'd
give it a once-over.

**What B4 should check or fix:** In `uploadController.js`, spell the imports
exactly right — `require('../models/File')` and
`require('../services/cloudinaryService')` (match the real filenames — and note
the service file is `cloudinaryservice.js`, so its own filename may want a
capital S too), and check the argument order of the `success`/`error` response
helpers against `utils/apiResponse.js`. Separately, I made *my* controller
defensive (it reuses the already-registered model instead of re-loading the
file), so the app won't crash because of my code either way.
