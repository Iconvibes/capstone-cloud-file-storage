const router = require("express").Router();
const upload = require("../middleware/upload");
const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { uploadBodySchema } = require("../validators/file.validator");
const { uploadFile } = require("../controllers/uploadController");

// multer must run first: it parses the multipart body, which validate() needs.
router.post(
  "/",
  authMiddleware,
  upload.single("file"),
  validate({ body: uploadBodySchema }),
  uploadFile
);

module.exports = router;