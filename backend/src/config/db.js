const mongoose = require("mongoose");

const connectDB = async () => mongoose.connect(process.env.MONGODB_URI);

module.exports = connectDB;
