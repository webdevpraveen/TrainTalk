const config = require('../config');

/**
 * In-memory room manager.
 * 
 * Room structure:
 * {
 *   roomId: string,
 *   trainNumber: string,
 *   journeyDate: string,       // YYYY-MM-DD
 *   users: Map<socketId, { nickname, token }>,
 *   createdAt: number
 * }
 */
const rooms = new Map();

/**
 * Generate a deterministic room ID from train number and journey date.
 */
function generateRoomId(trainNumber, journeyDate) {
    return `train_${trainNumber}_${journeyDate}`;
}

/**
 * Join a room - creates it if it doesn't exist.
 * Returns the current room info.
 */
function joinRoom(roomId, socketId, nickname, token, trainNumber, journeyDate) {
    if (!rooms.has(roomId)) {
        rooms.set(roomId, {
            roomId,
            trainNumber,
            journeyDate,
            users: new Map(),
            createdAt: Date.now(),
        });
    }

    const room = rooms.get(roomId);
    room.users.set(socketId, { nickname, token });

    return getRoomInfo(roomId);
}

/**
 * Leave a room - removes the user and deletes room if empty.
 * Returns true if room was deleted.
 */
function leaveRoom(roomId, socketId) {
    if (!rooms.has(roomId)) return false;

    const room = rooms.get(roomId);
    room.users.delete(socketId);

    if (room.users.size === 0) {
        rooms.delete(roomId);
        return true;
    }
    return false;
}

/**
 * Get room info: passenger count and user list.
 */
function getRoomInfo(roomId) {
    if (!rooms.has(roomId)) return null;

    const room = rooms.get(roomId);
    const passengers = [];
    for (const [, userData] of room.users) {
        passengers.push(userData.nickname);
    }

    return {
        roomId,
        trainNumber: room.trainNumber,
        journeyDate: room.journeyDate,
        passengerCount: room.users.size,
        passengers,
    };
}

/**
 * Get nickname for a socket in a room.
 */
function getNickname(roomId, socketId) {
    if (!rooms.has(roomId)) return null;
    const user = rooms.get(roomId).users.get(socketId);
    return user ? user.nickname : null;
}

/**
 * Find which room a socket is in.
 */
function findRoomBySocket(socketId) {
    for (const [roomId, room] of rooms.entries()) {
        if (room.users.has(socketId)) {
            return roomId;
        }
    }
    return null;
}

/**
 * Check if a token is already connected in a room (duplicate prevention).
 */
function isTokenConnected(roomId, token) {
    if (!rooms.has(roomId)) return false;
    const room = rooms.get(roomId);
    for (const [, userData] of room.users) {
        if (userData.token === token) return true;
    }
    return false;
}

/**
 * Cleanup expired rooms (30 min after journey end date).
 * Journey end is estimated as end-of-day of the journey date + 30 min buffer.
 */
function cleanupExpiredRooms() {
    const now = Date.now();
    for (const [roomId, room] of rooms.entries()) {
        // Estimate journey end as end of journey date
        const journeyEnd = new Date(room.journeyDate + 'T23:59:59').getTime();
        if (now > journeyEnd + config.ROOM_EXPIRY_AFTER_JOURNEY) {
            rooms.delete(roomId);
            console.log(`[RoomManager] Cleaned up expired room: ${roomId}`);
        }
    }
}

// Run cleanup periodically
setInterval(cleanupExpiredRooms, config.ROOM_CLEANUP_INTERVAL);

module.exports = {
    generateRoomId,
    joinRoom,
    leaveRoom,
    getRoomInfo,
    getNickname,
    findRoomBySocket,
    isTokenConnected,
};
