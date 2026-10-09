const mongoose = require('mongoose');
const File = require('../models/File');
const Folder = require('../models/Folder');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const { scanBuffer } = require('../services/malwareScan');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Bucket the file into the three list-filter categories. Every MIME type
// lands somewhere — videos, audio, archives, executables, unknown types all
// fall through to 'other' rather than being rejected.
function getFileType(mimetype) {
  if (mimetype.startsWith('image/')) return 'image';
  if (
    mimetype === 'application/pdf' ||
    mimetype.includes('word') ||
    mimetype.includes('excel') ||
    mimetype.includes('powerpoint') ||
    mimetype.includes('spreadsheet') ||
    mimetype.includes('presentation') ||
    mimetype.startsWith('text/')
  ) return 'document';
  return 'other';
}

async function uploadFile(req, res) {
  try {
    if (!req.file) {
      return errorResponse(res, 'No file selected', 400);
    }

    // Safety check before anything leaves this server: byte-level signature
    // scan (EICAR test file, embedded scripts in textual formats). It never
    // rejects on file type — only on known threat content.
    const verdict = scanBuffer(req.file.buffer, req.file.mimetype);
    if (!verdict.safe) {
      console.warn(
        `[upload] blocked "${req.file.originalname}" (${req.file.mimetype}, ${req.file.size}B) — threat: ${verdict.threat}`
      );
      return errorResponse(
        res,
        'This file was blocked by the safety check because it contains a known threat signature.',
        400
      );
    }

    const { folderId } = req.body;
    if (folderId) {
      if (!mongoose.Types.ObjectId.isValid(folderId)) {
        return errorResponse(res, 'Invalid folder', 400);
      }
      // The target folder must exist AND belong to the uploader — never
      // allow files to be filed under someone else's folder.
      const folder = await Folder.findOne({ _id: folderId, owner: req.user._id });
      if (!folder) {
        return errorResponse(res, 'Folder not found', 404);
      }
    }

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: `cloudfilestorageapp/${req.user.id}`,
    });

    const file = await File.create({
      owner: req.user.id,
      folder: folderId || null,
      originalName: req.file.originalname,
      displayName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileType: getFileType(req.file.mimetype),
      size: req.file.size,
      cloudUrl: result.secure_url,
      cloudPublicId: result.public_id,
    });

    return successResponse(res, file, 'File uploaded successfully', 201);
  } catch (err) {
    // Multer's size guard (100 MB) aborts the stream mid-parse, which lands
    // here when it surfaces through the route rather than the error handler.
    if (err.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(res, 'File is too large — the maximum upload size is 100 MB', 400);
    }
    // Cloudinary validates real content (e.g. rejects a corrupt PDF) and
    // answers those with http_code 400 — the file is bad, not the server,
    // so surface them as a client error instead of a generic 500.
    if (err && err.http_code === 400) {
      return errorResponse(res, `The file could not be stored: ${err.message}`, 400);
    }
    console.error(err);
    return errorResponse(res, 'Something went wrong while uploading the file', 500);
  }
}

module.exports = { uploadFile };
