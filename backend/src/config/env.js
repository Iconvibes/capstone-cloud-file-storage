// Startup environment validation.
//
// Two reasons this exists rather than letting the app boot blind:
//
//  1. PORT. A stray PORT=0 in the OS environment (some hosts and CI runners
//     set it) makes Node bind a RANDOM ephemeral port instead of failing.
//     The app then prints "Server running" and every client gets connection
//     refused, with nothing in the logs to explain it. We parse and range-check
//     instead of trusting `process.env.PORT || 5000`, which also silently
//     accepts "0" because "0" is a truthy string.
//
//  2. Missing secrets. Mongoose/Cloudinary fail deep inside a request at a
//     random time. Failing here, at boot, names the exact missing key.
//
// Platform-assigned ports (Render/Railway/Heroku/Fly all inject PORT) are
// plain integers and pass through untouched, so this stays compatible.

const REQUIRED = [
  "MONGO_URI",
  "JWT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

function resolvePort(raw) {
  const DEFAULT = 5000;
  if (raw === undefined || raw === "") return DEFAULT;

  const n = Number(raw);
  // 0 and negatives mean "pick a random port" to Node — never what we want.
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    console.warn(
      `[env] PORT=${JSON.stringify(raw)} is not a usable port (need 1-65535). ` +
        `Falling back to ${DEFAULT}. Set a valid PORT for predictable binding.`,
    );
    return DEFAULT;
  }
  return n;
}

function loadEnv() {
  require("dotenv").config();

  const missing = REQUIRED.filter(
    (key) => !process.env[key] || !String(process.env[key]).trim(),
  );

  if (missing.length) {
    console.error(
      `[env] Missing required environment variable(s): ${missing.join(", ")}\n` +
        `[env] Copy .env.example to .env and fill them in, or set them in your ` +
        `hosting provider's environment settings.`,
    );
    process.exit(1);
  }

  // A short JWT_SECRET means tokens are cheap to forge. Warn, don't block —
  // refusing to boot would lock a developer out of their own dev machine.
  if (process.env.NODE_ENV === "production" && process.env.JWT_SECRET.length < 32) {
    console.warn(
      "[env] JWT_SECRET is under 32 characters. Use a long random secret in production.",
    );
  }

  return {
    port: resolvePort(process.env.PORT),
    // Comma-separated so staging + prod can coexist in one variable.
    clientOrigins: (process.env.CLIENT_URL || "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
  };
}

module.exports = loadEnv();