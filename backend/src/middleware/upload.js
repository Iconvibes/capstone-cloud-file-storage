const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(), // keeps file in memory, so we can stream straight to Cloudinary
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      // images
      'image/jpeg',
      'image/png',
      // pdf
      'application/pdf',
      // word
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      // excel
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // powerpoint
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // text
      'text/plain',
      // zip
      'application/zip',
      'application/x-zip-compressed',
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('FILE_TYPE_NOT_ALLOWED'));
    }
    cb(null, true);
  },
});

module.exports = upload;