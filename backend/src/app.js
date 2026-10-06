// Validates required env vars and resolves PORT before anything else loads.
const env = require("./config/env");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const authRoutes = require("./routes/authRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const fileRoutes = require("./routes/fileRoutes");
const folderRoutes = require("./routes/folderRoutes");
const shareRoutes = require("./routes/shareRoutes");
const shareLinkRoutes = require("./routes/shareLinkRoutes");
const errorHandler = require("./middleware/errorHandler");
const { apiLimiter } = require("./middleware/rateLimiters");

const app = express();
const port = env.port;

app.use(helmet());
// CLIENT_URL is the deployed frontend origin; accept a comma-separated list so
// staging and prod can live in one variable. The localhost entries are a dev
// convenience only — they are left out of production so the deployed API never
// answers browser requests from arbitrary local origins.
const allowedOrigins = [
  ...env.clientOrigins,
  ...(process.env.NODE_ENV === "production"
    ? []
    : ["http://localhost:5173", "http://localhost:3000"]),
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  // Let the browser read the download filename when the frontend fetches
  // file bytes with credentials (axios blob downloads).
  exposedHeaders: ["Content-Disposition"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));




app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "CloudFileStorageApp API is running", data: null });
});

app.use("/api", apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/share", shareLinkRoutes); // /links first — must not be captured by /:token
app.use("/api/share", shareRoutes);

app.use(errorHandler);

const connectDB = require('./config/db');
connectDB();

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

module.exports = app;



