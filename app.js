require("dotenv").config();
require("./startup/db.js")(); // Initialize MongoDB connection
const express = require("express");
const logger = require("./startup/logger"); // Import the logger
const errorHandler = require("./startup/errorHandler.js"); // Import custom error handler
const app = express();
const { cors, helmet, limiter } = require("./startup/security");

app.use(helmet);
app.use(limiter);
app.use(cors); // <-- FIXED

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser middleware
const cookieParser = require("cookie-parser");
app.use(cookieParser());

require("./startup/routes")(app);

// Custom error handler for all other errors
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
