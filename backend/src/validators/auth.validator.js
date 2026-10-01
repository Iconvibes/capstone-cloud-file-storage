const z = require("zod");

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be 50 characters or fewer"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Please provide a valid email")),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Please provide a valid email")),
  password: z.string().min(1, "Password is required"),
});

module.exports = { registerSchema, loginSchema };