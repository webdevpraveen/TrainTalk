const axios = require('axios');
const config = require('../config');

/**
 * ═══ DEV DUMMY PNRs ═══
 * For development/testing only. Remove before production!
 * PNRs 1111111111 & 2222222222 → same train (test same-room join)
 * PNR 3333333333 → different train
 * PNR 4444444444 → different date
 */
const DEV_DUMMY_PNRS = {
    '1111111111': { trainNumber: '15032', journeyDate: '2026-03-01' },
    '2222222222': { trainNumber: '15032', journeyDate: '2026-03-01' },
    '3333333333': { trainNumber: '12301', journeyDate: '2026-03-01' },
    '4444444444': { trainNumber: '15032', journeyDate: '2026-03-05' },
};

/**
 * @param {string} pnr - 10-digit PNR number
 * @returns {{ trainNumber: string, journeyDate: string }}
 */
async function verifyPNR(pnr) {

    if (!pnr || !/^\d{10}$/.test(pnr)) {
        throw new Error('Invalid PNR format. Must be a 10-digit number.');
    }

    // ── Dev bypass: return dummy data instantly ──
    if (DEV_DUMMY_PNRS[pnr]) {
        console.log(`[DEV] Using dummy PNR data for ${pnr}`);
        return DEV_DUMMY_PNRS[pnr];
    }

    if (!config.RAPIDAPI_KEY) {
        throw new Error('PNR verification service is not configured. Please set RAPIDAPI_KEY.');
    }

    try {
        const response = await axios.get(
            `https://${config.RAPIDAPI_HOST}/api/v3/getPNRStatus`,
            {
                params: { pnrNumber: pnr },
                headers: {
                    'x-rapidapi-key': config.RAPIDAPI_KEY,
                    'x-rapidapi-host': config.RAPIDAPI_HOST,
                },
                timeout: 10000,
            }
        );

        const data = response.data;

        if (!data || (!data.data && !data.trainNumber)) {
            throw new Error('Could not retrieve PNR information. Please check your PNR number.');
        }

        const pnrData = data.data || data;
        const trainNumber = pnrData.trainNumber || pnrData.train_number || pnrData.trainNo;
        const dateOfJourney = pnrData.dateOfJourney || pnrData.journey_date || pnrData.doj;

        if (!trainNumber || !dateOfJourney) {
            throw new Error('PNR data is incomplete. Could not extract train details.');
        }

        const journeyDate = normalizeDate(dateOfJourney);

        return {
            trainNumber: String(trainNumber),
            journeyDate,
        };
    } catch (error) {
        if (error.response) {
            if (error.response.status === 429) {
                throw new Error('API rate limit exceeded. Please try again later.');
            }
            if (error.response.status === 401 || error.response.status === 403) {
                throw new Error('PNR verification service authentication failed.');
            }
        }
        if (error.message && !error.response) {
            throw error;
        }
        throw new Error('Failed to verify PNR. Please try again.');
    }
}

/**
 */
function normalizeDate(dateStr) {
    if (!dateStr) return null;

    // Already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

    // DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
        const [dd, mm, yyyy] = dateStr.split('-');
        return `${yyyy}-${mm}-${dd}`;
    }

    // DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [dd, mm, yyyy] = dateStr.split('/');
        return `${yyyy}-${mm}-${dd}`;
    }

    // Try native Date parsing as fallback
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
    }

    return dateStr;
}

module.exports = { verifyPNR };
