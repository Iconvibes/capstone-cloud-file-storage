const router = require("express").Router();
const upload = require("../middleware/upload");
const authMiddleware = require("../middleware/authMiddleware");
const { uploadFile } = require("../controllers/uploadController");

router.post("/", authMiddleware, upload.single("file"), uploadFile);

module.exports = router;


