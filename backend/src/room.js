const rooms = {};

function joinRoom(roomId, socketId) {
  if (!rooms[roomId]) {
    rooms[roomId] = new Set();
  }
  rooms[roomId].add(socketId);
}

function leaveRoom(socketId) {
  for (const roomId in rooms) {
    rooms[roomId].delete(socketId);

    if (rooms[roomId].size === 0) {
      delete rooms[roomId]; // auto destroy empty room
    }
  }
}

module.exports = {
  joinRoom,
  leaveRoom,
};
