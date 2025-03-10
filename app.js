require("dotenv").config();
require("./startup/db.js")(); // Initialize MongoDB connection
const express = require("express");
const http = require("http"); // ✅ Required for WebSockets
const { initializeWebSocket } = require("./startup/websocket"); // ✅ WebSocket Module
const logger = require("./startup/logger");
const errorHandler = require("./startup/errorHandler.js");
const { cors, helmet, limiter } = require("./startup/security");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();
const server = http.createServer(app); // ✅ Create HTTP Server for WebSockets

// ✅ Initialize WebSockets (No cyclic dependency)
const io = initializeWebSocket(server);

// ✅ Apply CORS globally
app.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Origin",
    process.env.FRONTEND_URL || "http://localhost:5173"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// ✅ Middleware
app.use(helmet);
app.use(limiter);
app.use(cors);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ Handle preflight (OPTIONS) requests
app.options("*", cors);

// ✅ Serve Static Files (Uploads)
app.use(
  "/uploads",
  (req, res, next) => {
    res.header(
      "Access-Control-Allow-Origin",
      process.env.FRONTEND_URL || "http://localhost:5173"
    );
    res.header("Access-Control-Allow-Credentials", "true");
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);

// ✅ Load Routes AFTER Middleware
require("./startup/routes")(app);

// ✅ Custom Error Handler
app.use(errorHandler);

// ✅ Start Server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => logger.info(`🚀 Server running on port ${PORT}`));

module.exports = { app, io };
