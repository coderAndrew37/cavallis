const logger = require("./logger");
const errorHandler = (err, req, res, next) => {
  logger.error(err.message, err);

  if (res.headersSent) {
    return next(err); // Prevents multiple responses
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;



