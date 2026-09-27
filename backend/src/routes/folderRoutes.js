const router = require("express").Router();
const { body, param } = require("express-validator");

const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { listFolders, createFolder, deleteFolder } = require("../controllers/folderController");

router.get("/", authMiddleware, listFolders);

router.post(
  "/",
  authMiddleware,
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Folder name is required")
    .isLength({ max: 100 })
    .withMessage("Folder name must be 100 characters or fewer"),
  validate,
  createFolder
);

router.delete(
  "/:id",
  authMiddleware,
  param("id").isMongoId().withMessage("Invalid folder id"),
  validate,
  deleteFolder
);

module.exports = router;