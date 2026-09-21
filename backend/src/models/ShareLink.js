const mongoose = require("mongoose");

const shareLinkSchema = new mongoose.Schema({
  file: { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ShareLink", shareLinkSchema);
