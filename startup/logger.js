const winston = require("winston");
require("winston-mongodb");

const transports = [
  new winston.transports.Console({
    handleExceptions: true,
  }),
  new winston.transports.File({ filename: "logs/error.log", level: "error" }),
  new winston.transports.File({ filename: "logs/combined.log" }),
];

// Add MongoDB transport for production environment
if (process.env.NODE_ENV === "production") {
  transports.push(
    new winston.transports.MongoDB({
      db: process.env.MONGODB_URI,
      options: { useUnifiedTopology: true },
      collection: "log",
      level: "error",
      handleExceptions: true,
    })
  );
}

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports,
  exitOnError: false, // Prevent exit on handled exceptions
});

module.exports = logger;
