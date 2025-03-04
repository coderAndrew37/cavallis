require("dotenv").config();
require("./startup/db.js")(); // Initialize MongoDB connection
const express = require("express");
const logger = require("./startup/logger");
const errorHandler = require("./startup/errorHandler.js");
const { cors, helmet, limiter } = require("./startup/security");
const path = require("path");

const app = express();

app.use(helmet);
app.use(limiter);
app.use(cors); // ✅ Allow cross-origin requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Cookie parser must be before routes
const cookieParser = require("cookie-parser");
app.use(cookieParser());

require("./startup/routes")(app); // ✅ Ensure routes come after middleware

// Serve static files from the "uploads" directory
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve uploaded files

// Custom error handler for all other errors
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
