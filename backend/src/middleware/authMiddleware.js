const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { errorResponse } = require("../utils/apiResponse");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, "Not authorized, no token", 401);
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return errorResponse(res, "Not authorized, user no longer exists", 401);
    }

    req.user = user;
    next();
  } catch (err) {
    return errorResponse(res, "Not authorized, invalid or expired token", 401);
  }
};

module.exports = authMiddleware;