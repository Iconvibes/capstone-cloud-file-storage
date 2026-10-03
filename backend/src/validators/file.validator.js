const z = require("zod");
const {
  objectId,
  displayName,
  optionalQuery,
  optionalNullableObjectId,
} = require("./helpers");

const fileIdParamSchema = z.object({ id: objectId });

const listQuerySchema = z.object({
  search: optionalQuery(z.string().trim().min(1, "search must be text")),
  type: optionalQuery(
    z.enum(["image", "document", "other"], "type must be one of: image, document, other")
  ),
  folder: optionalQuery(objectId),
  page: optionalQuery(
    z
      .coerce
      .number()
      .int("page must be a whole number")
      .min(1, "page must be at least 1")
      .max(1000000, "page is too large")
  ),
  limit: optionalQuery(
    z
      .coerce
      .number()
      .int("limit must be a whole number")
      .min(1, "limit must be at least 1")
      .max(50, "limit must be 50 or fewer")
  ),
});

const updateFileSchema = z.object({
  displayName: displayName.optional(),
  folder: z.union([objectId, z.null()]).optional(),
});

const uploadBodySchema = z.object({
  folderId: optionalNullableObjectId,
});

module.exports = { fileIdParamSchema, listQuerySchema, updateFileSchema, uploadBodySchema };