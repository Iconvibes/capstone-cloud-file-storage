const router = require("express").Router();
const { body, param } = require("express-validator");
const mongoose = require("mongoose");

const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { listFiles, getFile, downloadFile } = require("../controllers/fileController");
const { updateFile, deleteFile } = require("../controllers/manageController");

router.get("/", listFiles);
router.get("/:id", getFile);
router.get("/:id/download", downloadFile);

router.patch(
  "/:id",
  authMiddleware,
  param("id").isMongoId().withMessage("Invalid file id"),
  body("displayName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Display name cannot be empty")
    .isLength({ max: 100 })
    .withMessage("Display name must be 100 characters or fewer"),
  body("folder")
    .optional()
    .custom((value) => value === null || mongoose.isValidObjectId(value))
    .withMessage("folder must be a valid folder id or null"),
  validate,
  updateFile
);

router.delete(
  "/:id",
  authMiddleware,
  param("id").isMongoId().withMessage("Invalid file id"),
  validate,
  deleteFile
);

module.exports = router;