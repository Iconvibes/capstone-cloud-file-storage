const router = require("express").Router();

const authMiddleware = require("../middleware/authMiddleware");
const { successResponse } = require("../utils/apiResponse");
const ShareLink = require("../models/ShareLink");

// GET /api/share/links — the signed-in user's active share links, newest
// first, with the file's display details for the list UI. Mounted before the
// public "/:token" route so "links" is never swallowed as a token.
router.get("/links", authMiddleware, async (req, res, next) => {
  try {
    const links = await ShareLink.find({ owner: req.user._id, isActive: true })
      .sort({ createdAt: -1 })
      .populate("file", "displayName size createdAt mimeType fileType");

    return successResponse(res, { links }, "Share links retrieved", 200);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
