const router = require("express").Router();
const { listFiles, getFile, downloadFile, deleteFile } = require("../controllers/fileController");

router.get("/", listFiles);
router.get("/:id", getFile);
router.get("/:id/download", downloadFile);
router.delete("/:id", deleteFile);

module.exports = router;
