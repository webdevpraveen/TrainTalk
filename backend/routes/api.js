const express = require('express');
const router = express.Router();
const { pnrRateLimiter } = require('../middleware/rateLimiter');
const { createSession } = require('../middleware/sessionAuth');
const { verifyPNR } = require('../services/pnrService');
const { generateRoomId } = require('../services/roomManager');
const { getTrainStatus } = require('../services/trainStatusService');

/**
 * POST /api/verify-pnr
 */
router.post('/verify-pnr', pnrRateLimiter, async (req, res) => {
    try {
        const { pnr } = req.body;

        if (!pnr || !/^\d{10}$/.test(pnr)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid PNR. Please enter a valid 10-digit PNR number.',
            });
        }

        const { trainNumber, journeyDate } = await verifyPNR(pnr);
        const roomId = generateRoomId(trainNumber, journeyDate);
        const token = createSession({ roomId, trainNumber, journeyDate });

        return res.json({
            success: true,
            token,
            trainNumber,
            journeyDate,
            roomId,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            error: error.message || 'PNR verification failed. Please try again.',
        });
    }
});

/**
 * GET /api/train-status/:trainNumber
 * Returns live running status of a train.
 */
router.get('/train-status/:trainNumber', async (req, res) => {
    try {
        const { trainNumber } = req.params;
        const journeyDate = req.query.date || '';
        const status = await getTrainStatus(trainNumber, journeyDate);
        return res.json({ success: true, data: status });
    } catch (error) {
        return res.status(400).json({
            success: false,
            error: error.message || 'Could not fetch train status.',
        });
    }
});

module.exports = router;

