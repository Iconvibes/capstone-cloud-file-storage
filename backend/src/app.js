require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const fileRoutes = require("./routes/fileRoutes");
const folderRoutes = require("./routes/folderRoutes");
const shareRoutes = require("./routes/shareRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const port = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 })); // keep the general one too
// add near your other imports in app.js, or in a separate middleware/rateLimiters.js file
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5, // only 5 login attempts per 15 min per IP
  message: { success: false, message: "Too many login attempts, please try again later", data: null },
});
app.use(loginLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }));

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "CloudFileStorageApp API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/folders", folderRoutes);
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



