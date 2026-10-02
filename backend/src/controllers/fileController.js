const { Readable } = require("node:stream");
const mongoose = require("mongoose");
// Reuse the already-registered model if another slice loaded it first.
// (uploadController requires "../models/file" lowercase, which on case-insensitive
// filesystems would otherwise load models/File.js twice and crash the app.)
const File = mongoose.models.File || require("../models/File");
const { successResponse, errorResponse } = require("../utils/apiResponse");

// Pagination defaults for the list endpoint
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

/**
 * Parse a positive whole number from a raw query-string value.
 * Returns a default on empty/invalid input instead of erroring, and clamps to max.
 */
const parsePositiveInt = (value, defaultValue, max) => {
  if (value === undefined || value === null || String(value).trim() === "") {
    return defaultValue;
  }
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1) {
    return defaultValue;
  }
  return max ? Math.min(num, max) : num;
};

/**
 * GET /api/files
 * List ONLY the logged-in user's own files, with search / type / folder filters
 * and page / limit pagination. Defaults: page 1, limit 10, capped at 50,
 * sorted newest first (createdAt descending).
 */
const listFiles = async (req, res, next) => {
  try {
    const page = parsePositiveInt(req.query.page, DEFAULT_PAGE);
    const limit = parsePositiveInt(req.query.limit, DEFAULT_LIMIT, MAX_LIMIT);
    const skip = (page - 1) * limit;

    // Every query is scoped to the owner from the JWT — never trust client-supplied owners.
    const query = { owner: req.user._id };

    // Case-insensitive partial match on the file's display name.
    // Special regex characters are escaped so the term is matched literally
    // (and can't crash the query or be used for regex injection).
    if (req.query.search && String(req.query.search).trim() !== "") {
      const search = String(req.query.search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.displayName = { $regex: search, $options: "i" };
    }

    if (req.query.type && String(req.query.type).trim() !== "") {
      query.fileType = String(req.query.type).trim();
    }

    if (req.query.folder && String(req.query.folder).trim() !== "") {
      query.folder = String(req.query.folder).trim();
    }

    // countDocuments and find run as two parallel queries — one round trip each
    const [total, files] = await Promise.all([
      File.countDocuments(query),
      File.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    return successResponse(res, { files, pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    } }, "Files retrieved");
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/files/:id
 * Fetch one file's details. Files owned by someone else answer 404 (not 403)
 * so we never reveal that another user's file exists at that ID.
 */
const getFile = async (req, res, next) => {
  try {
    // :id was already verified as a valid ObjectId in fileRoutes.js
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });

    if (!file) {
      return errorResponse(res, "File not found", 404);
    }

    return successResponse(res, file, "File retrieved");
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/files/:id/download
 * Stream the user's own file as an attachment named after its display name.
 * The bytes never touch our server's disk or memory — we pipe Cloudinary's
 * response straight through to the client.
 */
const downloadFile = async (req, res, next) => {
  try {
    // Same ownership scoping as getFile: other users' files are simply "not found"
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });

    if (!file) {
      return errorResponse(res, "File not found", 404);
    }

    if (!file.cloudUrl || typeof file.cloudUrl !== "string" || !/^https?:\/\//i.test(file.cloudUrl)) {
      // Defensive: the model marks cloudUrl required, but old/seeded records may lack it
      return errorResponse(res, "File storage is unavailable, please try again later", 502);
    }

    let filename = file.displayName || file.originalName;
    // Keep only printable ASCII without quotes or control characters; fall back if nothing survives
    const sanitized = String(filename)
      .replace(/[^\x20-\x7E]/g, "")
      .replace(/["\\]/g, "");
    if (sanitized) {
      filename = sanitized;
    }

    // Only forward a Range header when the client actually sent one —
    // an unconditional download should get an unconditional upstream request.
    const upstreamHeaders = {};
    if (req.headers.range) {
      upstreamHeaders.Range = req.headers.range;
    }

    const upstream = await fetch(file.cloudUrl, {
      redirect: "follow",
      headers: upstreamHeaders,
    }).catch(() => null);

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
      "Content-Type": upstream.headers.get("content-type") || file.mimeType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
    };
    for (const h of ["content-length", "content-range", "accept-ranges"]) {
      const value = upstream.headers.get(h);
      if (value) headers[h] = value;
    }

    // 200 for full downloads, 206 when the client sent a Range header and
    // the cloud storage honored it
    res.status(req.headers.range && upstream.status === 206 ? 206 : 200).set(headers);
    // fetch gives a web ReadableStream, so convert it to a Node stream to pipe.
    // Bytes stream straight through — nothing is buffered on our server.
    const upstreamStream = Readable.fromWeb(upstream.body);
    upstreamStream.pipe(res);

    // If the client hangs up mid-transfer, stop pulling from the cloud storage
    res.on("close", () => {
      if (!res.writableEnded) {
        upstreamStream.destroy();
      }
    });
  } catch (err) {
    next(err);
  }
};

// NOTE: deleteFile is owned by another teammate's task — not part of B3.
const deleteFile = async (req, res) => res.json({ success: true, message: "Delete endpoint placeholder" });

module.exports = { listFiles, getFile, downloadFile, deleteFile };
