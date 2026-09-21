const router = require("express").Router();
const { createShareLink, getSharedFile } = require("../controllers/shareController");

router.post("/", createShareLink);
router.get("/:token", getSharedFile);

module.exports = router;
