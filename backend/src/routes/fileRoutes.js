const router = require("express").Router();

const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { listFiles, getFile, downloadFile } = require("../controllers/fileController");
const { updateFile, deleteFile } = require("../controllers/manageController");
const {
  fileIdParamSchema,
  listQuerySchema,
  updateFileSchema,
} = require("../validators/file.validator");

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

module.exports = router;