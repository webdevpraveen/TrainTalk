const { validateSession } = require('../middleware/sessionAuth');
const roomManager = require('../services/roomManager');
const config = require('../config');

// Track last message time per socket for rate limiting
const lastMessageTime = new Map();

/**
 * Initialize Socket.io event handlers.
 * 
 * @param {import('socket.io').Server} io
 */
function initChatHandler(io) {
    // Authenticate socket connection via session token
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error('Authentication required. No session token provided.'));
        }

        const session = validateSession(token);
        if (!session) {
            return next(new Error('Invalid or expired session. Please verify your PNR again.'));
        }

        // Attach session data to socket
        socket.sessionData = session;
        socket.sessionToken = token;
        next();
    });

    io.on('connection', (socket) => {
        console.log(`[Socket] Connected: ${socket.id}`);

        // ─── JOIN ROOM ───
        socket.on('join-room', ({ nickname }) => {
            if (!nickname || typeof nickname !== 'string') {
                socket.emit('error-message', { error: 'A nickname is required to join.' });
                return;
            }

            // Sanitize nickname
            const cleanNickname = nickname.trim().substring(0, 30);
            if (cleanNickname.length === 0) {
                socket.emit('error-message', { error: 'Nickname cannot be empty.' });
                return;
            }

            const { roomId, trainNumber, journeyDate } = socket.sessionData;

            // Check for duplicate connection with same token
            if (roomManager.isTokenConnected(roomId, socket.sessionToken)) {
                socket.emit('error-message', { error: 'You are already connected in another tab.' });
                return;
            }

            // Join the room
            socket.join(roomId);
            socket.currentRoom = roomId;

            const roomInfo = roomManager.joinRoom(
                roomId, socket.id, cleanNickname, socket.sessionToken, trainNumber, journeyDate
            );

            // Notify everyone in the room
            io.to(roomId).emit('system-message', {
                text: `🚃 ${cleanNickname} has joined the chat`,
                timestamp: Date.now(),
            });

            // Send updated room info to all
            io.to(roomId).emit('room-info', roomInfo);

            console.log(`[Socket] ${cleanNickname} joined room ${roomId} (${roomInfo.passengerCount} passengers)`);
        });

        // ─── SEND MESSAGE ───
        socket.on('send-message', ({ message }) => {
            const roomId = socket.currentRoom;
            if (!roomId) {
                socket.emit('error-message', { error: 'You must join a room first.' });
                return;
            }

            // Validate message
            if (!message || typeof message !== 'string') return;

            const cleanMessage = message.trim();
            if (cleanMessage.length === 0) return;

            // Enforce max message length
            if (cleanMessage.length > config.MAX_MESSAGE_LENGTH) {
                socket.emit('error-message', {
                    error: `Message too long. Maximum ${config.MAX_MESSAGE_LENGTH} characters.`,
                });
                return;
            }

            // Rate limit: 1 message per second
            const now = Date.now();
            const lastTime = lastMessageTime.get(socket.id) || 0;
            if (now - lastTime < config.MESSAGE_RATE_LIMIT_MS) {
                socket.emit('error-message', { error: 'Slow down! You can send 1 message per second.' });
                return;
            }
            lastMessageTime.set(socket.id, now);

            // Get nickname
            const nickname = roomManager.getNickname(roomId, socket.id);
            if (!nickname) return;

            // Broadcast message to the room (NOT stored anywhere)
            io.to(roomId).emit('chat-message', {
                nickname,
                message: cleanMessage,
                timestamp: Date.now(),
            });
        });

        // ─── DISCONNECT ───
        socket.on('disconnect', () => {
            const roomId = socket.currentRoom;
            if (roomId) {
                const nickname = roomManager.getNickname(roomId, socket.id);
                const roomDeleted = roomManager.leaveRoom(roomId, socket.id);

                if (nickname) {
                    io.to(roomId).emit('system-message', {
                        text: `👋 ${nickname} has left the chat`,
                        timestamp: Date.now(),
                    });
                }

                if (!roomDeleted) {
                    const roomInfo = roomManager.getRoomInfo(roomId);
                    if (roomInfo) {
                        io.to(roomId).emit('room-info', roomInfo);
                    }
                } else {
                    console.log(`[Socket] Room ${roomId} auto-deleted (empty)`);
                }
            }

            // Cleanup rate limit tracking
            lastMessageTime.delete(socket.id);
            console.log(`[Socket] Disconnected: ${socket.id}`);
        });
    });
}

module.exports = { initChatHandler };
