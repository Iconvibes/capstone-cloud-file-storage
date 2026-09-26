const File = require('../models/file');
const {uploaadToCloudinary} = require('../services/cloudinaryservice');

const { success, error } = require('../utils/apiResponse');
const mongoose = require('mongoose');

async function uploadFile(req, res) {
  try {
    // 1. File presence check
    if (!req.file) {
      return error(res, 400, 'No file selected');
    }

    // 2. folderId validation (if provided)
    const { folderId } = req.body;
    if (folderId) {
      if (!mongoose.Types.ObjectId.isValid(folderId)) {
        return error(res, 400, 'Invalid folder');
      }
        const folder = await File.findOne({ _id: folderId, owner: req.user.id, type: 'folder' });
    }

    // 3. Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: `cloudfilestorageapp/${req.user.id}`,
    });

    // 4. Save record in MongoDB
    const file = await File.create({
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
      cloudUrl: result.secure_url,
      owner: req.user.id,
      folder: folderId || null,
    });

    return success(res, 201, 'File uploaded successfully', file);
  } catch (err) {
    if (err.message === 'FILE_TYPE_NOT_ALLOWED') {
      return error(res, 400, 'File type not allowed');
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return error(res, 400, 'File is too large');
    }
    console.error(err);
    return error(res, 500, 'Something went wrong while uploading the file');
  }
}

module.exports = { uploadFile };

