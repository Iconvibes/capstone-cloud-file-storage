const success = (res, data = null, message = "Success", statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

// Every error carries `data: null` so success and failure responses share
// the exact same { success, message, data } shape (extra `errors` list for
// validation failures).
const error = (res, message = "Error", statusCode = 500, errors = undefined) =>
  res.status(statusCode).json({ success: false, message, data: null, ...(errors ? { errors } : {}) });

module.exports = { successResponse: success, errorResponse: error };




