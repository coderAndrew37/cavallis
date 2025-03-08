const mongoose = require("mongoose");
const logger = require("./logger");

module.exports = function () {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    logger.error("MONGO_URI is not defined.");
    process.exit(1); // Exit if MongoDB URI is not set
  }

  // Set up options for MongoDB connection

  const mongooseOptions = {
    ssl: true, // Removed for local connection
  };

  mongoose
    .connect(mongoURI, mongooseOptions)
    .then(() => logger.info("Connected to MongoDB"))
    .catch((err) => {
      logger.error("Could not connect to MongoDB", err);
      process.exit(1); // Exit on failed connection to prevent app from running without DB
    });
};
