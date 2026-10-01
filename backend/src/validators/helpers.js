const z = require("zod");

const objectId = z
  .string()
  .regex(/^[0-9a-f]{24}$/i, "Must be a valid 24-character ObjectId");

const displayName = z
  .string()
  .trim()
  .min(1, "Display name cannot be empty")
  .max(100, "Display name must be 100 characters or fewer");

// Query params always arrive as strings (e.g. ?search=). An empty value is
// treated as "not provided" so it never triggers a validation error.
const optionalQuery = (schema) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

// Multipart bodies send empty form fields as "". Treat "" and null as "not
// provided" for optional ObjectIds (e.g. upload folderId).
const optionalNullableObjectId = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  objectId.optional()
);

// Share expiry: "" or null means "no expiry". Anything else must parse as a
// real date AND be in the future (evaluated against the server clock).
const optionalFutureDate = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z
    .coerce
    .date()
    .refine((d) => !Number.isNaN(d.getTime()), "Expiry must be a valid date")
    .refine((d) => d.getTime() > Date.now(), "Expiry must be a date in the future")
    .optional()
);

module.exports = { objectId, displayName, optionalQuery, optionalNullableObjectId, optionalFutureDate };