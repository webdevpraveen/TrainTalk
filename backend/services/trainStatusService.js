const axios = require('axios');
const config = require('../config');

/**
 * ═══ DEV DUMMY STATUS ═══
 * For development/testing only. Remove before production!
 * Full route with past + current + upcoming stations
 */
const DEV_DUMMY_STATUS = {
    '15032': {
        trainName: 'Gorakhdham SF Express (GKP-BTI)',
        trainNumber: '15032',
        currentStationIndex: 5,
        status: 'Running',
        delay: '11 Hrs 11 Mins Late',
        lastUpdated: null,
        route: [
            { name: 'Gorakhpur Junction', km: 0, pf: '9', schArr: '—', schDep: '16:20', actArr: '—', actDep: '16:26', status: 'departed' },
            { name: 'Khalilabad', km: 33, pf: '1', schArr: '16:54', schDep: '16:56', actArr: '17:08', actDep: '17:14', status: 'departed' },
            { name: 'Basti', km: 63, pf: '1', schArr: '17:19', schDep: '17:22', actArr: '17:36', actDep: '17:42', status: 'departed' },
            { name: 'Babhnan', km: 94, pf: '1', schArr: '17:46', schDep: '17:48', actArr: '18:04', actDep: '18:13', status: 'departed' },
            { name: 'Mankapur Junction', km: 123, pf: '2', schArr: '18:13', schDep: '18:15', actArr: '18:34', actDep: '18:41', status: 'departed' },
            { name: 'Gonda Junction', km: 151, pf: '1', schArr: '18:45', schDep: '18:50', actArr: '—', actDep: '—', status: 'current' },
        ],
    },
    '12301': {
        trainName: 'Howrah Rajdhani',
        trainNumber: '12301',
        currentStationIndex: 2,
        status: 'Running',
        delay: 'On Time',
        lastUpdated: null,
        route: [
            { name: 'New Delhi (NDLS)', km: 0, schArr: '—', schDep: '16:55', actArr: '—', actDep: '16:55', status: 'departed' },
            { name: 'Kanpur Central (CNB)', km: 440, schArr: '21:28', schDep: '21:33', actArr: '21:28', actDep: '21:33', status: 'departed' },
            { name: 'Allahabad Jn (ALD)', km: 634, schArr: '23:35', schDep: '23:40', actArr: '23:35', actDep: '—', status: 'current' },
            { name: 'Mughal Sarai (MGS)', km: 782, schArr: '01:40', schDep: '01:45', actArr: '—', actDep: '—', status: 'upcoming' },
            { name: 'Gaya Jn (GAYA)', km: 997, schArr: '04:40', schDep: '04:45', actArr: '—', actDep: '—', status: 'upcoming' },
            { name: 'Dhanbad Jn (DHN)', km: 1159, schArr: '06:30', schDep: '06:35', actArr: '—', actDep: '—', status: 'upcoming' },
            { name: 'Howrah Jn (HWH)', km: 1447, schArr: '09:55', schDep: '—', actArr: '—', actDep: '—', status: 'upcoming' },
        ],
    },
};

/**
 * Fetch live train running status.
 */
async function getTrainStatus(trainNumber, journeyDate) {
    if (!trainNumber) {
        throw new Error('Train number is required.');
    }

    // ── Dev bypass ──
    if (DEV_DUMMY_STATUS[trainNumber]) {
        console.log(`[DEV] Using dummy train status for ${trainNumber}`);
        const dummy = JSON.parse(JSON.stringify(DEV_DUMMY_STATUS[trainNumber]));
        dummy.lastUpdated = new Date().toISOString();
        return dummy;
    }

    if (!config.RAPIDAPI_KEY) {
        throw new Error('Train status service is not configured.');
    }

    try {
        const response = await axios.get(
            `https://${config.RAPIDAPI_HOST}/api/v1/liveTrainStatus`,
            {
                params: { trainNo: trainNumber, startDay: '1' },
                headers: {
                    'x-rapidapi-key': config.RAPIDAPI_KEY,
                    'x-rapidapi-host': config.RAPIDAPI_HOST,
                },
                timeout: 10000,
            }
        );

        const data = response.data;
        if (!data || !data.data) {
            return {
                trainNumber,
                trainName: `Train #${trainNumber}`,
                currentStationIndex: -1,
                status: 'Unknown',
                delay: '—',
                lastUpdated: new Date().toISOString(),
                route: [],
            };
        }

        const trainData = data.data;
        const route = [];
        if (trainData.route) {
            trainData.route.forEach((st, i) => {
                route.push({
                    name: st.station_name || st.stationName || '—',
                    km: st.distance || 0,
                    schArr: st.scheduled_arrival || st.sta || '—',
                    schDep: st.scheduled_departure || st.std || '—',
                    actArr: st.actual_arrival || st.eta || '—',
                    actDep: st.actual_departure || st.etd || '—',
                    status: st.has_departed ? 'departed' : (st.is_current_station ? 'current' : 'upcoming'),
                });
            });
        }

        const currentIdx = route.findIndex(s => s.status === 'current');

        return {
            trainNumber,
            trainName: trainData.train_name || `Train #${trainNumber}`,
            currentStationIndex: currentIdx >= 0 ? currentIdx : -1,
            status: trainData.status || 'Running',
            delay: trainData.late_mins ? `${trainData.late_mins} min late` : (trainData.delay || 'On Time'),
            lastUpdated: new Date().toISOString(),
            route,
        };
    } catch (error) {
        console.error('[TrainStatus] API error:', error.message);
        return {
            trainNumber,
            trainName: `Train #${trainNumber}`,
            currentStationIndex: -1,
            status: 'Unavailable',
            delay: '—',
            lastUpdated: new Date().toISOString(),
            route: [],
            error: 'Could not fetch live status. Try again later.',
        };
    }
}

module.exports = { getTrainStatus };
