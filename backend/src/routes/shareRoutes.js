const router = require("express").Router();

const validate = require("../middleware/validate");
const { getSharedFile, downloadSharedFile } = require("../controllers/shareController");
const { shareTokenParamSchema } = require("../validators/share.validator");

// Both endpoints are intentionally PUBLIC (no auth) — they are reached
// through the shareable link itself.
router.get("/:token/download", validate({ params: shareTokenParamSchema }), downloadSharedFile);
router.get("/:token", validate({ params: shareTokenParamSchema }), getSharedFile);

module.exports = router;