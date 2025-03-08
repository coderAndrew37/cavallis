require("dotenv").config();
require("./startup/db.js")(); // Initialize MongoDB connection
const express = require("express");
const http = require("http"); // ✅ Required for WebSockets
const socketIo = require("socket.io");
const logger = require("./startup/logger");
const errorHandler = require("./startup/errorHandler.js");
const { cors, helmet, limiter } = require("./startup/security");
const path = require("path");

const app = express();
const server = http.createServer(app); // ✅ Create HTTP Server for WebSockets
const io = socketIo(server, {
  cors: { origin: "*" }, // ✅ Allow WebSocket connections from all origins
});

// ✅ WebSocket Event Listeners
io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // Example: Listen for a new notification event
  socket.on("newNotification", (data) => {
    io.emit("newNotification", data); // Broadcast notification to all connected clients
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// ✅ Store `io` in `app.locals` so other routes can use it
app.locals.io = io;

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
server.listen(PORT, () => logger.info(`🚀 Server running on port ${PORT}`));

module.exports = { app, io }; // ✅ Export `io` for use in other files
