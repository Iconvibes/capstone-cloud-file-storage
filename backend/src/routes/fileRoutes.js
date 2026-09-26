const router = require("express").Router();
const { query, param } = require("express-validator");
const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { listFiles, getFile, downloadFile, deleteFile } = require("../controllers/fileController");

// GET /api/files — list/search/filter/paginate the logged-in user's files.
// page/limit are intentionally NOT rejected here: the controller silently
// defaults/clamps them (page -> 1, limit -> 10, capped at 50) per the spec.
const listValidators = [
  query("search")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("search must be text"),
  query("type")
    .optional({ values: "falsy" })
    .isIn(["image", "document", "other"])
    .withMessage("type must be one of: image, document, other"),
  query("folder")
    .optional({ values: "falsy" })
    .isMongoId()
    .withMessage("folder must be a valid folder ID"),
];

// Shared rule for every :id route — bad IDs are rejected with 400
// before they can ever reach a database query.
const idValidator = [
  param("id").isMongoId().withMessage("Invalid file ID"),
];

router.get("/", authMiddleware, listValidators, validate, listFiles);
router.get("/:id/download", authMiddleware, idValidator, validate, downloadFile);
router.get("/:id", authMiddleware, idValidator, validate, getFile);

// NOTE: deleteFile is owned by another teammate's task — left as the placeholder.
router.delete("/:id", deleteFile);

module.exports = router;
