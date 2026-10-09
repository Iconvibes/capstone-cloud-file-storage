const multer = require('multer');

// A cloud storage accepts every file type — there is deliberately NO MIME
// whitelist here (an older one blocked videos, audio, CSVs, SVGs, EXEs, …).
// The two guards that remain are:
//   • the size limit below, enforced by multer while it buffers the body, and
//   • the signature scan in uploadController (blocks known-malware signatures
//     before anything is handed to cloud storage).
// Files are kept in memory so they can be streamed straight to Cloudinary;
// the frontend uploads its queue one file at a time to keep that buffer small.
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
});

module.exports = upload;
module.exports.MAX_UPLOAD_BYTES = MAX_UPLOAD_BYTES;