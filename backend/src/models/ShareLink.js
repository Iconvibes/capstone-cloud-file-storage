const mongoose = require("mongoose");

const shareLinkSchema = new mongoose.Schema({
  file: { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

// Database-level guarantee: only ONE active share link may exist per file.
// Revoked (isActive: false) links are allowed to accumulate as history.
shareLinkSchema.index(
  { file: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

module.exports = mongoose.model("ShareLink", shareLinkSchema);
