const listFiles = async (req, res) => res.json({ success: true, data: [] });
const getFile = async (req, res) => res.json({ success: true, message: "Get file endpoint placeholder" });
const downloadFile = async (req, res) => res.json({ success: true, message: "Download endpoint placeholder" });
const deleteFile = async (req, res) => res.json({ success: true, message: "Delete endpoint placeholder" });

module.exports = { listFiles, getFile, downloadFile, deleteFile };
