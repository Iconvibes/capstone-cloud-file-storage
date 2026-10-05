const crypto = require("node:crypto");
const { Readable } = require("node:stream");

const ShareLink = require("../models/ShareLink");
const File = require("../models/File");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { getCloudinaryStream } = require("../services/cloudinaryService");

const EXPIRED_LINK_MESSAGE = "This link is invalid or has expired.";

// The shareable URL a user copies and sends to others. Prefers the configured
// frontend origin, otherwise falls back to a same-origin relative path.
const buildShareUrl = (token) => {
  const base = (process.env.CLIENT_URL || "").replace(/\/+$/, "");
  return base ? `${base}/share/${token}` : `/share/${token}`;
};

const generateToken = () => crypto.randomBytes(24).toString("base64url");

const buildSharePayload = (link) => ({
  token: link.token,
  shareUrl: buildShareUrl(link.token),
  expiresAt: link.expiresAt,
  isActive: link.isActive,
});

/**
 * Create a shareable link for one of the logged-in user's files.
 * One active link per file: an existing active, unexpired link is returned
 * as-is (200); only when none is valid is a new link minted (201).
 */
const createShareLink = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return errorResponse(res, "File not found", 404);
    }
    if (String(file.owner) !== String(req.user._id)) {
      return errorResponse(res, "You don't have permission to do that", 403);
    }

    const now = new Date();

    // Expired-but-still-active links must not be reused or block a fresh one.
    await ShareLink.updateMany(
      { file: file._id, isActive: true, expiresAt: { $lte: now } },
      { isActive: false }
    );

    const activeLink = await ShareLink.findOne({
      file: file._id,
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    });
    if (activeLink) {
      return successResponse(res, buildSharePayload(activeLink), "Shareable link already exists", 200);
    }

    const payload = { file: file._id, owner: file.owner, isActive: true };
    const newLink = await ShareLink.create({ ...payload, token: generateToken(), expiresAt: req.body.expiresAt ?? null });

    return successResponse(res, buildSharePayload(newLink), "Shareable link created", 201);
  } catch (err) {
    // Duplicate-key (a concurrent request won the race, or a token collision):
    // return the existing active link instead of a raw MongoDB error.
    if (err && err.code === 11000) {
      try {
        const existing = await ShareLink.findOne({
          file: req.params.id,
          isActive: true,
          $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
        });
        if (existing) {
          return successResponse(res, buildSharePayload(existing), "Shareable link already exists", 200);
        }
        const retried = await ShareLink.create({
          file: req.params.id,
          owner: req.user._id,
          token: generateToken(),
          isActive: true,
          expiresAt: req.body.expiresAt ?? null,
        });
        return successResponse(res, buildSharePayload(retried), "Shareable link created", 201);
      } catch (retryErr) {
        return next(retryErr);
      }
    }
    return next(err);
  }
};

/**
 * Revoke a file's share link(s). Idempotent: revoking with no active link
 * still answers 200.
 */
const revokeShareLink = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return errorResponse(res, "File not found", 404);
    }
    if (String(file.owner) !== String(req.user._id)) {
      return errorResponse(res, "You don't have permission to do that", 403);
    }

    await ShareLink.updateMany({ file: file._id, isActive: true }, { isActive: false });

    return successResponse(res, null, "Share link revoked", 200);
  } catch (err) {
    next(err);
  }
};

// Shared validation chain for the public (no-auth) endpoints. Returns the link
// for any EXISTING, non-revoked share; time-expiry is decided by the caller so
// it can answer 410 (expired) instead of 404 (gone/revoked).
const findValidSharedLink = async (token) => {
  const link = await ShareLink.findOne({ token });
  if (!link || !link.isActive) return null;
  return link;
};

const isExpired = (link) => Boolean(link.expiresAt) && new Date(link.expiresAt).getTime() <= Date.now();

/**
 * GET /api/share/:token
 * Public. Reveals ONLY the shared file's own details — no owner, no cloud URL.
 */
const getSharedFile = async (req, res, next) => {
  try {
    const link = await findValidSharedLink(req.params.token);
    if (!link) {
      return errorResponse(res, EXPIRED_LINK_MESSAGE, 404);
    }
    if (isExpired(link)) {
      return errorResponse(res, EXPIRED_LINK_MESSAGE, 410);
    }

    const file = await File.findById(link.file);
    if (!file) {
      return errorResponse(res, EXPIRED_LINK_MESSAGE, 404);
    }

    return successResponse(
      res,
      {
        id: file._id,
        displayName: file.displayName,
        originalName: file.originalName,
        fileType: file.fileType,
        mimeType: file.mimeType,
        size: file.size,
        createdAt: file.createdAt,
        expiresAt: link.expiresAt,
      },
      "Shared file retrieved"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/share/:token/download
 * Public. Streams the shared file's bytes straight from cloud storage, using
 * the same download semantics as the owner-facing route (Range support, 502
 * on storage failure, 416 on an unavailable range).
 */
const downloadSharedFile = async (req, res, next) => {
  try {
    const link = await findValidSharedLink(req.params.token);
    if (!link) {
      return errorResponse(res, EXPIRED_LINK_MESSAGE, 404);
    }
    if (isExpired(link)) {
      return errorResponse(res, EXPIRED_LINK_MESSAGE, 410);
    }

    const file = await File.findById(link.file);
    if (!file) {
      return errorResponse(res, EXPIRED_LINK_MESSAGE, 404);
    }

    if (!file.cloudUrl || typeof file.cloudUrl !== "string" || !/^https?:\/\//i.test(file.cloudUrl)) {
      return errorResponse(res, "File storage is unavailable, please try again later", 502);
    }

    const filename = file.displayName || file.originalName || "download";
    const encodedFilename = encodeURIComponent(filename);
    const asciiFilename = filename.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "");

    const upstream = await getCloudinaryStream(file, req.headers.range);

    if (!upstream || !upstream.body) {
      return errorResponse(res, "File storage is unavailable, please try again later", 502);
    }
    if (upstream.status === 416) {
      return errorResponse(res, "Requested file range is not available", 416);
    }
    if (!upstream.ok) {
      return errorResponse(res, "File storage is unavailable, please try again later", 502);
    }

    const headers = {
      "Content-Type": file.mimeType || upstream.headers.get("content-type") || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${asciiFilename || "download"}"; filename*=UTF-8''${encodedFilename}`,
    };
    // Same gzip guard as the owner-facing download: never forward a
    // compressed content-length when fetch has already decompressed the body.
    const contentEncoding = (upstream.headers.get("content-encoding") || "identity").toLowerCase();
    const isIdentityEncoding = contentEncoding === "identity";
    for (const h of ["content-length", "content-range", "accept-ranges"]) {
      if (h === "content-length" && !isIdentityEncoding) continue;
      const value = upstream.headers.get(h);
      if (value) headers[h] = value;
    }

    res.status(req.headers.range && upstream.status === 206 ? 206 : 200).set(headers);
    const upstreamStream = Readable.fromWeb(upstream.body);
    upstreamStream.pipe(res);

    res.on("close", () => {
      if (!res.writableEnded) {
        upstreamStream.destroy();
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createShareLink, revokeShareLink, getSharedFile, downloadSharedFile };