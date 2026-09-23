const successResponse = (res, data = null, message = "Success", statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const errorResponse = (res, message = "Error", statusCode = 500, errors = undefined) =>
  res.status(statusCode).json({ success: false, message, ...(errors ? { errors } : {}) });

module.exports = { successResponse, errorResponse };




