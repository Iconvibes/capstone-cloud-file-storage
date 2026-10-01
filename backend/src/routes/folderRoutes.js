const router = require("express").Router();

const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { listFolders, createFolder, deleteFolder } = require("../controllers/folderController");
const { createFolderSchema, folderIdParamSchema } = require("../validators/folder.validator");

router.get("/", authMiddleware, listFolders);

router.post(
  "/",
  authMiddleware,
  validate({ body: createFolderSchema }),
  createFolder
);

router.delete(
  "/:id",
  authMiddleware,
  validate({ params: folderIdParamSchema }),
  deleteFolder
);

module.exports = router;