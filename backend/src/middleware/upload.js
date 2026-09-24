const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(), // keeps file in memory, so you can stream straight to Cloudinary
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('FILE_TYPE_NOT_ALLOWED'));
    }
    cb(null, true);
  },
});

module.exports = upload;