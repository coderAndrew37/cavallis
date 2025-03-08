require("dotenv").config();
require("./startup/db.js")(); // Initialize MongoDB connection
const express = require("express");
const http = require("http"); // ✅ Required for WebSockets
const { initializeWebSocket } = require("./startup/websocket"); // ✅ WebSocket Module
const logger = require("./startup/logger");
const errorHandler = require("./startup/errorHandler.js");
const { cors, helmet, limiter } = require("./startup/security");
const path = require("path");

const app = express();
const server = http.createServer(app); // ✅ Create HTTP Server for WebSockets

// ✅ Initialize WebSockets (No cyclic dependency)
const io = initializeWebSocket(server);

// Middleware
app.use(helmet);
app.use(limiter);
app.use(cors);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Cookie parser must be before routes
const cookieParser = require("cookie-parser");
app.use(cookieParser());

require("./startup/routes")(app); // ✅ Ensure routes come after middleware

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Custom error handler
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => logger.info(`🚀 Server running on port ${PORT}`));

module.exports = { app, io };
