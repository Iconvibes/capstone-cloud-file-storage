const router = require("express").Router();
const { listFolders, createFolder } = require("../controllers/folderController");

router.get("/", listFolders);
router.post("/", createFolder);

module.exports = router;
