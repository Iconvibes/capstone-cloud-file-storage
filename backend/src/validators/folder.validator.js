const z = require("zod");
const { objectId } = require("./helpers");

const createFolderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Folder name is required")
    .max(100, "Folder name must be 100 characters or fewer"),
});

const folderIdParamSchema = z.object({ id: objectId });

module.exports = { createFolderSchema, folderIdParamSchema };