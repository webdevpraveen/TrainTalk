const rateLimit = require('express-rate-limit');

const pnrRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 500,
    message: {
        success: false,
        error: 'Too many PNR verification attempts. Please try again after an hour.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip,
    validate: { trustProxy: false, xForwardedForHeader: false },
});

module.exports = { pnrRateLimiter };
