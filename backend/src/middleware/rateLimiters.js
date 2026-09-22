const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { success: false, message: "Too many login attempts, please try again later", data: null },
});

module.exports = { loginLimiter };