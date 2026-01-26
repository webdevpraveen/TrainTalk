const { joinRoom, leaveRoom } = require("./room");

module.exports = function (io) {
  io.on("connection", (socket) => {

    socket.on("join-room", ({ roomId, username }) => {
      socket.join(roomId);
      const count = joinRoom(roomId, socket.id);

      io.to(roomId).emit("system-message", {
        message: `${username} joined the train`,
        passengers: count
      });
    });

    socket.on("send-message", ({ roomId, username, message }) => {
      io.to(roomId).emit("chat-message", {
        username,
        message
      });
    });

    socket.on("disconnect", () => {
      const result = leaveRoom(socket.id);
      if (!result) return;

      io.to(result.roomId).emit("system-message", {
        message: `A passenger left the train`,
        passengers: result.size
      });
    });

  });
};
