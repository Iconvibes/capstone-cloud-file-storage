const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  folder: { type: mongoose.Schema.Types.ObjectId, ref: "Folder", default: null },
  originalName: { type: String, required: true },
  displayName: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileType: { type: String, required: true },
  size: { type: Number, required: true },
  cloudUrl: { type: String, required: true },
  cloudPublicId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("File", fileSchema);
