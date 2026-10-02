const cloudinary = require("../config/cloudinary");
const File = require("../models/File");
const Folder = require("../models/Folder");
const ShareLink = require("../models/ShareLink");
const { successResponse, errorResponse } = require("../utils/apiResponse");

const updateFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return errorResponse(res, "File not found", 404);
    }

    if (String(file.owner) !== String(req.user._id)) {
      return errorResponse(res, "You don't have permission to do that", 403);
    }

    const { displayName, folder } = req.body;

    if (displayName === undefined && folder === undefined) {
      return errorResponse(res, "Nothing to update", 400);
    }

    if (displayName !== undefined) {
      file.displayName = displayName.trim();
    }

    if (folder !== undefined) {
      if (folder === null) {
        file.folder = null;
      } else {
        const targetFolder = await Folder.findOne({ _id: folder, owner: req.user._id });
        if (!targetFolder) {
          return errorResponse(res, "Target folder not found", 400);
        }
        file.folder = targetFolder._id;
      }
    }

    await file.save();

    return successResponse(res, file, "File updated successfully", 200);
  } catch (err) {
    next(err);
  }
};

const deleteFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return errorResponse(res, "File not found", 404);
    }

    if (String(file.owner) !== String(req.user._id)) {
      return errorResponse(res, "You don't have permission to do that", 403);
    }

    await ShareLink.deleteMany({ file: file._id });

    if (file.cloudPublicId) {
      const resourceType = file.fileType === "image" ? "image" : "raw";
      await cloudinary.uploader.destroy(file.cloudPublicId, { resource_type: resourceType });
    }

    await File.deleteOne({ _id: file._id });

    return successResponse(res, null, "File deleted successfully", 200);
  } catch (err) {
    next(err);
  }
};

module.exports = { updateFile, deleteFile };