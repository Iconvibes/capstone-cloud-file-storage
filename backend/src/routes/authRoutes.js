const router = require("express").Router();
const { register, login, getMe } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const { loginLimiter } = require("../middleware/rateLimiters");

router.post("/register", register);
router.post("/login", loginLimiter, login);
router.get("/me", authMiddleware, getMe);

module.exports = router;