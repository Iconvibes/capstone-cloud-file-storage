const { errorResponse } = require("../utils/apiResponse");

// express-validator-compatible error shape so existing frontend parsing keeps
// working: each item is { param, msg, location }.
const toErrorItems = (issues, location) =>
  issues.map((issue) => ({
    param: issue.path.join("."),
    msg: issue.message,
    location,
  }));

// validate({ body?, query?, params? }) returns an Express middleware that runs
// the given zod schemas. Valid data is written back to req.<part> (trimmed,
// coerced and typed); any failure short-circuits with a 400.
const validate = (schemas = {}) => {
  // Fail closed: a validate() call with no schemas is a bug, not a no-op.
  if (Object.keys(schemas).length === 0) {
    throw new Error("validate() requires at least one of: body, query, params");
  }

  return (req, res, next) => {
    const errors = [];

    for (const [part, schema] of Object.entries(schemas)) {
      if (!schema || typeof schema.safeParse !== "function") {
        throw new Error(`validate(): '${part}' is not a zod schema`);
      }

      const source = req[part] ?? {};
      const result = schema.safeParse(source);

      if (!result.success) {
        errors.push(...toErrorItems(result.error.issues, part));
      } else {
        req[part] = result.data;
      }
    }

    if (errors.length > 0) {
      return errorResponse(res, "Validation failed", 400, errors);
    }
    return next();
  };
};

module.exports = validate;