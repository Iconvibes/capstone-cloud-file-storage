const errorHandler = (err, req, res, next) => {
  console.error(err);

  // Upload guards thrown by multer/fileFilter never reach the controller —
  // translate them into the documented 400s with user-readable messages.
  if (err.message === "FILE_TYPE_NOT_ALLOWED") {
    return res.status(400).json({ success: false, message: "File type not allowed", data: null });
  }
  if (err.name === "MulterError") {
    const message = err.code === "LIMIT_FILE_SIZE" ? "File is too large" : err.message;
    return res.status(400).json({ success: false, message, data: null });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    data: null,
  });
};

module.exports = errorHandler;
