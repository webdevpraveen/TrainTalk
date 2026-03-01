const { v4: uuidv4 } = require('uuid');
const config = require('../config');

// In-memory session store: token -> { roomId, trainNumber, journeyDate, createdAt }
const sessions = new Map();

/**
 * Create a temporary session token after successful PNR verification.
 * Token expires after SESSION_TTL (2 hours).
 */
function createSession(data) {
    const token = uuidv4();
    sessions.set(token, {
        ...data,
        createdAt: Date.now(),
    });
    return token;
}

/**
 * Validate a session token. Returns session data or null.
 */
function validateSession(token) {
    if (!token || !sessions.has(token)) return null;

    const session = sessions.get(token);
    if (Date.now() - session.createdAt > config.SESSION_TTL) {
        sessions.delete(token);
        return null;
    }
    return session;
}

/**
 * Remove a session token (on disconnect or expiry).
 */
function destroySession(token) {
    sessions.delete(token);
}

/**
 * Periodic cleanup of expired sessions.
 */
function cleanupExpiredSessions() {
    const now = Date.now();
    for (const [token, session] of sessions.entries()) {
        if (now - session.createdAt > config.SESSION_TTL) {
            sessions.delete(token);
        }
    }
}

// Cleanup expired sessions every 15 minutes
setInterval(cleanupExpiredSessions, 15 * 60 * 1000);

module.exports = { createSession, validateSession, destroySession };
