const rooms = {};

function joinRoom(roomId, socketId) {
  if (!rooms[roomId]) {
    rooms[roomId] = new Set();
  }
  rooms[roomId].add(socketId);
  return rooms[roomId].size;
}

function leaveRoom(socketId) {
  for (const roomId in rooms) {
    if (rooms[roomId].has(socketId)) {
      rooms[roomId].delete(socketId);
      const size = rooms[roomId].size;

      if (size === 0) {
        delete rooms[roomId];
        console.log(`🧹 Room destroyed: ${roomId}`);
        return { roomId, size: 0 };
      }

      return { roomId, size };
    }
  }
  return null;
}

module.exports = { joinRoom, leaveRoom };
