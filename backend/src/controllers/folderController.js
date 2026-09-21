const listFolders = async (req, res) => res.json({ success: true, data: [] });
const createFolder = async (req, res) => res.json({ success: true, message: "Create folder endpoint placeholder" });

module.exports = { listFolders, createFolder };
