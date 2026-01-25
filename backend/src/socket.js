const { joinRoom, leaveRoom } = require("./room");

module.exports = function (io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-room", ({ roomId, username }) => {
      socket.join(roomId);
      joinRoom(roomId, socket.id);

      io.to(roomId).emit("system-message", {
        message: `${username} joined the train`
      });
    });

    socket.on("send-message", ({ roomId, message, username }) => {
      io.to(roomId).emit("chat-message", {
        username,
        message
      });
    });

    socket.on("disconnect", () => {
      leaveRoom(socket.id);
      console.log("User disconnected:", socket.id);
    });
  });
};
