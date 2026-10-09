const errorHandler = (err, req, res, next) => {
  console.error(err);

  // Upload guards thrown by multer never reach the controller — translate
  // them into the documented 400s with user-readable messages. There is no
  // file-type rejection: every type is accepted (size and content are the
  // only checks).
  if (err.name === "MulterError") {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File is too large — the maximum upload size is 100 MB"
        : err.message;
    return res.status(400).json({ success: false, message, data: null });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    data: null,
  });
};

module.exports = errorHandler;
