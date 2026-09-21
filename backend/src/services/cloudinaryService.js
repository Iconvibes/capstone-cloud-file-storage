const cloudinary = require("cloudinary").v2;

const uploadToCloudinary = (filePath, options = {}) =>
  cloudinary.uploader.upload(filePath, options);

module.exports = { uploadToCloudinary };
