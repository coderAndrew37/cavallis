const socketIo = require("socket.io");

let io;

const initializeWebSocket = (server) => {
  io = socketIo(server, {
    cors: { origin: process.env.FRONTEND_URL || "http://localhost:5173" },
  });

  io.on("connection", (socket) => {
    console.log("🔌 User connected:", socket.id);

    socket.on("newNotification", (data) => {
      io.emit("newNotification", data);
    });

    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);
    });
  });

  return io;
};

const getIoInstance = () => {
  if (!io) {
    throw new Error("WebSocket has not been initialized!");
  }
  return io;
};

module.exports = { initializeWebSocket, getIoInstance };
