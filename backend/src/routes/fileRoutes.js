const router = require("express").Router();

const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { listFiles, getFile, downloadFile } = require("../controllers/fileController");
const { updateFile, deleteFile } = require("../controllers/manageController");
const { createShareLink, revokeShareLink } = require("../controllers/shareController");
const {
  fileIdParamSchema,
  listQuerySchema,
  updateFileSchema,
} = require("../validators/file.validator");
const {
  createShareSchema,
} = require("../validators/share.validator");

// GET /api/files — list/search/filter/paginate the logged-in user's files.
router.get("/", authMiddleware, validate({ query: listQuerySchema }), listFiles);
router.get("/:id/download", authMiddleware, validate({ params: fileIdParamSchema }), downloadFile);
router.get("/:id", authMiddleware, validate({ params: fileIdParamSchema }), getFile);

router.patch(
  "/:id",
  authMiddleware,
  validate({ params: fileIdParamSchema, body: updateFileSchema }),
  updateFile
);

router.delete("/:id", authMiddleware, validate({ params: fileIdParamSchema }), deleteFile);

// Shareable links (B5): owner-only create/revoke. The public endpoints that
// consume these links live in shareRoutes.js (/api/share/:token).
router.post("/:id/share", authMiddleware, validate({ params: fileIdParamSchema, body: createShareSchema }), createShareLink);
router.delete("/:id/share", authMiddleware, validate({ params: fileIdParamSchema }), revokeShareLink);

module.exports = router;