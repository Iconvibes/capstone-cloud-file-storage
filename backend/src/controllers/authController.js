const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { successResponse, errorResponse } = require("../utils/apiResponse");

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return errorResponse(res, "Name, email and password are required", 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse(res, "Please provide a valid email", 400);
    }

    if (password.length < 8) {
      return errorResponse(res, "Password must be at least 8 characters", 400);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, "Email already in use", 409);
    }

    const user = await User.create({ name, email, password });
    const token = generateToken({ id: user._id });

    return successResponse(
      res,
      { user: { id: user._id, name: user.name, email: user.email }, token },
      "Account created successfully",
      201
    );
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, "Email and password are required", 400);
    }

    // password has `select: false` on the model, so explicitly ask for it here
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return errorResponse(res, "Invalid email or password", 401);
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return errorResponse(res, "Invalid email or password", 401);
    }

    const token = generateToken({ id: user._id });

    return successResponse(
      res,
      { user: { id: user._id, name: user.name, email: user.email }, token },
      "Login successful",
      200
    );
  } catch (err) {
    next(err);
  }
};
const getMe = async (req, res, next) => {
  try {
    // req.user was attached by authMiddleware
    return successResponse(
      res,
      { id: req.user._id, name: req.user.name, email: req.user.email },
      "User fetched successfully",
      200
    );
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };



