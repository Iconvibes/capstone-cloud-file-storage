const Folder = require("../models/Folder");
const File = require("../models/File");
const { successResponse, errorResponse } = require("../utils/apiResponse");

const listFolders = async (req, res, next) => {
  try {
    const folders = await Folder.find({ owner: req.user._id }).sort({ createdAt: -1 });

    return successResponse(res, { folders }, "Folders retrieved successfully", 200);
  } catch (err) {
    next(err);
  }
};

const createFolder = async (req, res, next) => {
  try {
    const { name } = req.body;

    const folder = await Folder.create({ name, owner: req.user._id });

    return successResponse(res, folder, "Folder created successfully", 201);
  } catch (err) {
    if (err.code === 11000) {
      return errorResponse(res, "A folder with this name already exists", 409);
    }
    next(err);
  }
};

// Rename a folder. The unique index is per (owner, name), so renaming into
// an existing sibling name surfaces as the same 409 as folder creation.
const renameFolder = async (req, res, next) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder) {
      return errorResponse(res, "Folder not found", 404);
    }

    if (String(folder.owner) !== String(req.user._id)) {
      return errorResponse(res, "You don't have permission to do that", 403);
    }

    folder.name = req.body.name;
    await folder.save();

    return successResponse(res, folder, "Folder renamed successfully", 200);
  } catch (err) {
    if (err.code === 11000) {
      return errorResponse(res, "A folder with this name already exists", 409);
    }
    next(err);
  }
};

const deleteFolder = async (req, res, next) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder) {
      return errorResponse(res, "Folder not found", 404);
    }

    if (String(folder.owner) !== String(req.user._id)) {
      return errorResponse(res, "You don't have permission to do that", 403);
    }

    await File.updateMany({ folder: folder._id }, { $set: { folder: null } });
    await Folder.deleteOne({ _id: folder._id });

    return successResponse(res, null, "Folder deleted successfully", 200);
  } catch (err) {
    next(err);
  }
};

module.exports = { listFolders, createFolder, renameFolder, deleteFolder };