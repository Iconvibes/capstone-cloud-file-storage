const mongoose = require('mongoose');
const File = require('../models/File');
const Folder = require('../models/Folder');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

function getFileType(mimetype) {
  if (mimetype.startsWith('image/')) return 'image';
  if (
    mimetype === 'application/pdf' ||
    mimetype.includes('word') ||
    mimetype.includes('excel') ||
    mimetype.includes('powerpoint') ||
    mimetype.includes('spreadsheet') ||
    mimetype.includes('presentation') ||
    mimetype === 'text/plain'
  ) return 'document';
  return 'other';
}

async function uploadFile(req, res) {
  try {
    if (!req.file) {
      return errorResponse(res, 'No file selected', 400);
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
    if (err.message === 'FILE_TYPE_NOT_ALLOWED') {
      return errorResponse(res, 'File type not allowed', 400);
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(res, 'File is too large', 400);
    }
    console.error(err);
    return errorResponse(res, 'Something went wrong while uploading the file', 500);
  }
}

module.exports = { uploadFile };
