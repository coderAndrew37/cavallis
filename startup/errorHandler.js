const logger = require("./logger");

const errorHandler = (err, req, res, next) => {
  // Log the error details using Winston
  logger.error(err.message, err);

  // Prepare error response for client
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode; // Set to 500 if not already set
  res.status(statusCode);

  // In production, send only the message without stack trace
  res.json({
    message: err.message,
    // Only include stack trace in development
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
