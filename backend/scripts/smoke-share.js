// B5 smoke suite. Boots the real app on :5099 against a DEDICATED test
// database (cloudfilestorage_test) so teammates' local data is never touched.
// Run from backend/ with:  node scripts/smoke-share.js
process.env.MONGO_URI = "mongodb://127.0.0.1:27017/cloudfilestorage_test";

const mongoose = require("mongoose");
const app = require("../src/app");

const File = require("../src/models/File");
const ShareLink = require("../src/models/ShareLink");
const User = require("../src/models/User");

const PORT = 5099;
const server = app.listen(PORT, () => main().catch(console.error));
const base = `http://127.0.0.1:${PORT}`;

let passed = 0;
let failed = 0;
function check(name, cond, extra = "") {
  if (cond) { passed++; console.log(`  PASS ${name}`); }
  else { failed++; console.log(`  FAIL ${name}  ${extra}`); }
}

async function api(path, { method = "GET", token, body, rawBody } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let bodyOut;
  if (rawBody !== undefined && rawBody !== null) {
    bodyOut = rawBody;
  } else if (body !== undefined && body !== null) {
    headers["Content-Type"] = "application/json";
    bodyOut = JSON.stringify(body);
  }
  const res = await fetch(`${base}${path}`, { method, headers, body: bodyOut });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, headers: res.headers, text };
}

function tid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function validObjectId() { return new mongoose.Types.ObjectId().toString(); }

async function registerUser(label) {
  const suffix = tid();
  const email = `${label}-${suffix}@b5.test`;
  const { status, json } = await api("/api/auth/register", {
    method: "POST",
    body: { name: `${label} ${suffix}`, email, password: "TestPass123" },
  });
  return { status, json, email, token: json && json.data && json.data.token };
}

async function seedFile(ownerId, extra = {}) {
  const doc = await File.create({
    owner: ownerId,
    folder: null,
    originalName: "seed.txt",
    displayName: "seed.txt",
    mimeType: "text/plain",
    fileType: "document",
    size: 5,
    cloudUrl: "https://example.com/seed.txt",
    cloudPublicId: `seed-${tid()}`,
    ...extra,
  });
  return doc._id.toString();
}

async function main() {
  const uploadedFileIds = [];
  try {
    console.log("== setup ==");
    const health = await api("/api/health");
    check("service boot / health 200", health.status === 200);

    const u1 = await registerUser("u1");
    const u2 = await registerUser("u2");
    check("u1 register 201 + token", u1.status === 201 && !!u1.token);
    check("u2 register 201 + token", u2.status === 201 && !!u2.token);

    const u1Doc = await User.findOne({ email: u1.email });
    const u1Id = String(u1Doc._id);

    let uploadOk = false;
    let file1;
    const fd = new FormData();
    fd.append("file", new Blob([Buffer.from("B5 smoke upload content")], { type: "text/plain" }), "b5-note.txt");
    const up = await api("/api/upload", { method: "POST", token: u1.token, rawBody: fd });
    if (up.status === 201 && up.json && up.json.data && up.json.data._id) {
      uploadOk = true;
      file1 = String(up.json.data._id);
      uploadedFileIds.push(file1);
      console.log("  Cloudinary upload WORKED — real file used for download tests");
    } else {
      file1 = await seedFile(u1Id, { cloudUrl: "not-a-real-url", originalName: "b5-note.txt", displayName: "b5-note.txt" });
      console.log(`  Cloudinary upload unavailable (status ${up.status}) — seeded file, download will hit 502 path`);
    }

    console.log("== auth / validation negatives ==");
    let r = await api(`/api/files/${file1}/share`, { method: "POST" });
    check("no token -> 401", r.status === 401);

    r = await api("/api/files/not-an-id/share", { method: "POST", token: u1.token, body: {} });
    check("invalid :id -> 400", r.status === 400);

    r = await api(`/api/files/${validObjectId()}/share`, { method: "POST", token: u1.token, body: {} });
    check("valid id, nonexistent file -> 404", r.status === 404);

    r = await api(`/api/files/${file1}/share`, { method: "POST", token: u2.token, body: {} });
    check("non-owner -> 403", r.status === 403);

    r = await api(`/api/files/${file1}/share`, { method: "POST", token: u1.token, body: { expiresAt: "2020-01-01" } });
    check("past expiresAt -> 400", r.status === 400);

    r = await api(`/api/files/${file1}/share`, { method: "POST", token: u1.token, body: { expiresAt: "garbage" } });
    check("invalid expiresAt -> 400", r.status === 400);

    console.log("== create / idempotent / info ==");
    const future = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    r = await api(`/api/files/${file1}/share`, { method: "POST", token: u1.token, body: { expiresAt: future } });
    check("create share -> 201", r.status === 201);
    const first = r.json && r.json.data;
    check("payload has token + shareUrl + isActive", !!first && !!first.token && !!first.shareUrl && first.isActive === true);
    check("shareUrl built from CLIENT_URL", !!first && first.shareUrl === `http://localhost:3000/share/${first.token}`);
    check("expiresAt persisted", !!first && !!first.expiresAt);

    r = await api(`/api/files/${file1}/share`, { method: "POST", token: u1.token, body: { expiresAt: future } });
    check("repeat create -> 200 same token", r.status === 200 && r.json.data.token === first.token);

    r = await api(`/api/share/${first.token}`);
    check("public info -> 200", r.status === 200);
    check("info exposes file fields only", r.status === 200 && !!r.json.data.displayName && !r.json.data.cloudUrl && !r.json.data.owner && !r.json.data.cloudPublicId);

    console.log("== download ==");
    const dl = await api(`/api/share/${first.token}/download`);
    if (uploadOk) {
      check("download (real cloud) -> 200", dl.status === 200);
      check("download sets attachment header", dl.headers.get("content-disposition") && dl.headers.get("content-disposition").includes("b5-note.txt"));
    } else {
      check("download (broken storage) -> 502", dl.status === 502);
    }
    const ranged = await fetch(`${base}/api/share/${first.token}/download`, { headers: { Range: "bytes=0-3" } });
    check("download with Range -> 200/206", uploadOk ? [200, 206].includes(ranged.status) : ranged.status === 502);

    console.log("== permanent link (no expiry) ==");
    const file2 = await seedFile(u1Id);
    r = await api(`/api/files/${file2}/share`, { method: "POST", token: u1.token, body: {} });
    check("share without expiresAt -> 201, expiresAt null", r.status === 201 && r.json.data.expiresAt === null);
    const permToken = r.json.data.token;
    r = await api(`/api/share/${permToken}`);
    check("permanent link info -> 200", r.status === 200);
    r = await api(`/api/files/${file2}/share`, { method: "DELETE", token: u1.token });
    check("revoke -> 200 data null", r.status === 200 && r.json.data === null);
    r = await api(`/api/share/${permToken}`);
    check("revoked link info -> 404", r.status === 404);

    console.log("== revoke file1 ==");
    r = await api(`/api/files/${file1}/share`, { method: "DELETE", token: u1.token });
    check("revoke file1 -> 200", r.status === 200);
    r = await api(`/api/share/${first.token}`);
    check("revoked -> 404", r.status === 404);
    r = await api(`/api/share/${first.token}/download`);
    check("revoked download -> 404", r.status === 404);
    r = await api(`/api/files/${file1}/share`, { method: "DELETE", token: u1.token });
    check("revoke again idempotent -> 200", r.status === 200);
    r = await api(`/api/files/${file1}/share`, { method: "DELETE", token: u2.token });
    check("revoke non-owner -> 403", r.status === 403);

    console.log("== token validation ==");
    r = await api("/api/share/%21bad%21");
    check("malformed token char -> 400", r.status === 400);
    r = await api(`/api/share/${"a".repeat(129)}`);
    check("overlong token -> 400", r.status === 400);
    r = await api("/api/share/bz_0XyQvArY3n7kW9LpUcDmHsUjF");
    check("valid-shape unknown token -> 404", r.status === 404);

    console.log("== expired links ==");
    const expFileId = await seedFile(u1Id);
    const expToken = `expired_${tid()}`;
    await ShareLink.create({ file: expFileId, owner: u1Id, token: expToken, isActive: true, expiresAt: new Date(Date.now() - 60000) });
    r = await api(`/api/share/${expToken}`);
    check("expired link -> 410", r.status === 410);
    r = await api(`/api/files/${expFileId}/share`, { method: "POST", token: u1.token, body: {} });
    check("re-share after expiry -> 201 fresh", r.status === 201);
    const activeCount = await ShareLink.countDocuments({ file: expFileId, isActive: true });
    check("exactly 1 active link after re-share", activeCount === 1);
    const expiredDoc = await ShareLink.findOne({ token: expToken });
    check("old expired link deactivated", !!expiredDoc && expiredDoc.isActive === false);
    r = await api(`/api/share/${expiredDoc.token}`);
    check("old expired token now -> 404", r.status === 404);
    r = await api(`/api/share/${(await ShareLink.findOne({ file: expFileId, isActive: true })).token}`);
    check("new link after re-share works -> 200", r.status === 200);

    console.log("== concurrency (option A: unique index) ==");
    const file4 = await seedFile(u1Id);
    const results = await Promise.all(
      Array.from({ length: 5 }, () => api(`/api/files/${file4}/share`, { method: "POST", token: u1.token, body: {} }))
    );
    check("all 5 concurrent creates 200/201 (no 500)", results.every((x) => x.status === 200 || x.status === 201), results.map((x) => x.status).join(","));
    const concActive = await ShareLink.countDocuments({ file: file4, isActive: true });
    check("exactly 1 active link from 5 concurrent requests", concActive === 1);

    console.log("== cleanup cloud assets ==");
    for (const id of uploadedFileIds) {
      const del = await api(`/api/files/${id}`, { method: "DELETE", token: u1.token });
      console.log(`  deleted uploaded file ${id} -> ${del.status}`);
    }
  } finally {
    await mongoose.connection.dropDatabase().catch(() => {});
    await mongoose.disconnect().catch(() => {});
    server.close();
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
  }
}