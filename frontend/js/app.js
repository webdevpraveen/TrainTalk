/* ═══════════════════════════════════════════════
   TrainTalk – Frontend Application Logic
   ═══════════════════════════════════════════════ */

(function () {
    'use strict';

    // ─── State ───
    let socket = null;
    let sessionToken = null;
    let roomId = null;
    let trainNumber = null;
    let journeyDate = null;
    let nickname = null;

    // ─── DOM Elements ───
    const screens = {
        pnr: document.getElementById('pnr-screen'),
        nickname: document.getElementById('nickname-screen'),
        chat: document.getElementById('chat-screen'),
    };

    // PNR Screen
    const pnrInput = document.getElementById('pnr-input');
    const verifyBtn = document.getElementById('verify-btn');
    const verifyLoader = document.getElementById('verify-loader');
    const pnrError = document.getElementById('pnr-error');

    // Nickname Screen
    const nicknameInput = document.getElementById('nickname-input');
    const joinBtn = document.getElementById('join-btn');
    const backToPnrBtn = document.getElementById('back-to-pnr-btn');
    const displayTrain = document.getElementById('display-train');
    const displayDate = document.getElementById('display-date');

    // Chat Screen
    const chatTrainInfo = document.getElementById('chat-train-info');
    const connectionStatus = document.getElementById('connection-status');
    const passengerCount = document.getElementById('passenger-count');
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const leaveBtn = document.getElementById('leave-btn');
    const charCount = document.getElementById('char-count');

    // Train Status Panel
    const statusToggle = document.getElementById('status-toggle');
    const statusArrow = document.getElementById('status-arrow');
    const statusDetails = document.getElementById('status-details');
    const statusLoading = document.getElementById('status-loading');
    const statusContent = document.getElementById('status-content');
    const statusTrainName = document.getElementById('status-train-name');
    const statusRunning = document.getElementById('status-running');
    const statusDelay = document.getElementById('status-delay');
    const statusCurrentStation = document.getElementById('status-current-station');
    const stationList = document.getElementById('station-list');
    const statusUpdated = document.getElementById('status-updated');
    const refreshStatusBtn = document.getElementById('refresh-status-btn');

    let statusRefreshTimer = null;

    // ─── Particles ───
    function initParticles() {
        const container = document.getElementById('particles');
        if (!container) return;
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 8 + 's';
            particle.style.animationDuration = (6 + Math.random() * 6) + 's';
            container.appendChild(particle);
        }
    }

    // ─── Screen Navigation ───
    function showScreen(name) {
        Object.values(screens).forEach((s) => s.classList.remove('active'));
        screens[name].classList.add('active');
    }

    // ─── Error Display ───
    function showError(element, message) {
        element.textContent = message;
        element.classList.add('visible');
        setTimeout(() => element.classList.remove('visible'), 6000);
    }

    function hideError(element) {
        element.classList.remove('visible');
    }

    // ─── PNR Input Handling ───
    pnrInput.addEventListener('input', () => {
        // Only allow digits
        pnrInput.value = pnrInput.value.replace(/\D/g, '');
        verifyBtn.disabled = pnrInput.value.length !== 10;
        hideError(pnrError);
    });

    pnrInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !verifyBtn.disabled) {
            verifyBtn.click();
        }
    });

    // ─── PNR Verification ───
    verifyBtn.addEventListener('click', async () => {
        const pnr = pnrInput.value.trim();

        if (!/^\d{10}$/.test(pnr)) {
            showError(pnrError, 'Please enter a valid 10-digit PNR number.');
            return;
        }

        // Show loading state
        verifyBtn.classList.add('loading');
        verifyBtn.disabled = true;
        hideError(pnrError);

        try {
            const response = await fetch('/api/verify-pnr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pnr }),
            });

            const data = await response.json();

            if (!data.success) {
                showError(pnrError, data.error || 'PNR verification failed.');
                return;
            }

            // Store session data
            sessionToken = data.token;
            roomId = data.roomId;
            trainNumber = data.trainNumber;
            journeyDate = data.journeyDate;

            // Update nickname screen
            displayTrain.textContent = `Train #${trainNumber}`;
            displayDate.textContent = formatDate(journeyDate);

            // Navigate to nickname screen
            pnrInput.value = ''; // Clear PNR immediately
            showScreen('nickname');
            nicknameInput.focus();
        } catch (err) {
            console.error('PNR verification error:', err);
            showError(pnrError, 'Network error. Please check your connection and try again.');
        } finally {
            verifyBtn.classList.remove('loading');
            verifyBtn.disabled = pnrInput.value.length !== 10;
        }
    });

    // ─── Nickname Input Handling ───
    nicknameInput.addEventListener('input', () => {
        joinBtn.disabled = nicknameInput.value.trim().length === 0;
    });

    nicknameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !joinBtn.disabled) {
            joinBtn.click();
        }
    });

    // ─── Back Button ───
    backToPnrBtn.addEventListener('click', () => {
        sessionToken = null;
        roomId = null;
        showScreen('pnr');
        pnrInput.focus();
    });

    // ─── Join Chat ───
    joinBtn.addEventListener('click', () => {
        nickname = nicknameInput.value.trim().substring(0, 30);
        if (!nickname) return;

        // Update chat header
        chatTrainInfo.textContent = `Train #${trainNumber} • ${formatDate(journeyDate)}`;

        // Connect socket and join room
        connectSocket();
        showScreen('chat');
        messageInput.focus();

        // Start fetching live train status
        fetchTrainStatus();
        startStatusAutoRefresh();
    });

    // ─── Socket Connection ───
    function connectSocket() {
        if (socket) {
            socket.disconnect();
        }

        socket = io({
            auth: { token: sessionToken },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });

        // Connection events
        socket.on('connect', () => {
            updateConnectionStatus('connected');
            socket.emit('join-room', { nickname });
        });

        socket.on('disconnect', () => {
            updateConnectionStatus('disconnected');
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
            updateConnectionStatus('disconnected');
            addSystemMessage('⚠️ Connection failed: ' + err.message);
        });

        // Chat events
        socket.on('chat-message', (data) => {
            addChatMessage(data);
        });

        socket.on('system-message', (data) => {
            addSystemMessage(data.text);
        });

        socket.on('room-info', (data) => {
            updatePassengerCount(data.passengerCount);
        });

        socket.on('error-message', (data) => {
            addSystemMessage('⚠️ ' + data.error);
        });
    }

    // ─── Connection Status ───
    function updateConnectionStatus(status) {
        connectionStatus.className = 'connection-status ' + status;
        const statusText = connectionStatus.querySelector('.status-text');
        if (status === 'connected') {
            statusText.textContent = 'Connected';
        } else {
            statusText.textContent = 'Disconnected';
        }
    }

    // ─── Passenger Count ───
    function updatePassengerCount(count) {
        const countEl = passengerCount.querySelector('.count-number');
        countEl.textContent = count;
        countEl.style.transform = 'scale(1.3)';
        setTimeout(() => { countEl.style.transform = 'scale(1)'; }, 200);
    }

    // ─── Add Chat Message ───
    function addChatMessage(data) {
        const isOwn = data.nickname === nickname;

        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', isOwn ? 'own' : 'other');

        const nicknameDiv = document.createElement('div');
        nicknameDiv.classList.add('message-nickname');
        nicknameDiv.textContent = isOwn ? 'You' : data.nickname;

        const bubbleDiv = document.createElement('div');
        bubbleDiv.classList.add('message-bubble');
        bubbleDiv.textContent = data.message;

        const timeDiv = document.createElement('div');
        timeDiv.classList.add('message-time');
        timeDiv.textContent = formatTime(data.timestamp);

        msgDiv.appendChild(nicknameDiv);
        msgDiv.appendChild(bubbleDiv);
        msgDiv.appendChild(timeDiv);

        chatMessages.appendChild(msgDiv);
        scrollToBottom();
    }

    // ─── Add System Message ───
    function addSystemMessage(text) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('system-message');
        msgDiv.textContent = text;
        chatMessages.appendChild(msgDiv);
        scrollToBottom();
    }

    // ─── Send Message ───
    messageInput.addEventListener('input', () => {
        const len = messageInput.value.length;
        sendBtn.disabled = len === 0;
        charCount.textContent = len;

        if (len > 450) {
            charCount.style.color = '#fbbf24';
        } else if (len > 490) {
            charCount.style.color = '#f87171';
        } else {
            charCount.style.color = '';
        }
    });

    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !sendBtn.disabled) {
            sendMessage();
        }
    });

    sendBtn.addEventListener('click', sendMessage);

    function sendMessage() {
        const message = messageInput.value.trim();
        if (!message || !socket) return;

        socket.emit('send-message', { message });
        messageInput.value = '';
        charCount.textContent = '0';
        sendBtn.disabled = true;
        messageInput.focus();
    }


    // ─── Fullscreen Train Status Modal ───
    const openStatusBtn = document.getElementById('open-live-status');
    const lsOverlay = document.getElementById('ls-overlay');
    const lsCloseBtn = document.getElementById('ls-close-btn');
    const lsRefreshBtn = document.getElementById('ls-refresh-btn');
    const lsTrainTitle = document.getElementById('ls-train-title');
    const lsDelayBanner = document.getElementById('ls-delay-banner');
    const lsDelayText = document.getElementById('ls-delay-text');
    const lsLoading = document.getElementById('ls-loading');
    const lsRouteScroll = document.getElementById('ls-route-scroll');
    const lsRoute = document.getElementById('ls-route');

    // Open Modal
    openStatusBtn.addEventListener('click', () => {
        lsOverlay.classList.add('open');
        fetchTrainStatus();
    });

    // Close Modal
    lsCloseBtn.addEventListener('click', () => {
        lsOverlay.classList.remove('open');
    });

    // Refresh
    lsRefreshBtn.addEventListener('click', () => {
        // Add minimal rotation anim
        lsRefreshBtn.style.transform = 'rotate(180deg)';
        setTimeout(() => lsRefreshBtn.style.transform = 'none', 300);
        fetchTrainStatus();
    });

    async function fetchTrainStatus() {
        if (!trainNumber) return;

        // Show loading state
        lsLoading.style.display = 'flex';
        lsRouteScroll.style.display = 'none';
        lsRefreshBtn.style.display = 'none';
        lsDelayBanner.style.display = 'none';

        lsTrainTitle.textContent = 'Fetching...';

        try {
            const url = `/api/train-status/${trainNumber}${journeyDate ? '?date=' + journeyDate : ''}`;
            const response = await fetch(url);
            const result = await response.json();

            if (!result.success || !result.data) throw new Error('No data');
            renderLiveStatus(result.data);

        } catch (err) {
            console.error('Live status error:', err);
            lsLoading.style.display = 'none';
            lsRouteScroll.style.display = 'block';
            lsRoute.innerHTML = `<div style="padding: 20px; color: #dc2626; text-align: center;">Could not load live status data. Please try again later.</div>`;
        }
    }

    function renderLiveStatus(data) {
        lsLoading.style.display = 'none';
        lsRouteScroll.style.display = 'block';
        lsRefreshBtn.style.display = 'flex';

        lsTrainTitle.textContent = `${data.trainNumber} - ${data.trainName || 'Express'}`;

        // Delay Banner
        lsDelayBanner.style.display = 'flex';
        if (data.delay && data.delay !== 'On Time' && data.delay !== '—') {
            lsDelayBanner.style.display = 'flex';
            lsDelayText.textContent = `${data.delay}`;
        } else {
            lsDelayBanner.style.display = 'none';
        }

        // Render Route Timeline
        lsRoute.innerHTML = '<div class="ls-track-line"></div>'; // Reset and add track

        if (!data.route || data.route.length === 0) {
            lsRoute.innerHTML = `<div style="padding: 20px; color: #64748b; text-align: center;">Route information is unavailable.</div>`;
            return;
        }

        const totalStations = data.route.length;
        let currentPassed = 0;

        data.route.forEach((st, idx) => {
            if (st.status === 'departed' || st.status === 'current') {
                currentPassed = idx;
            }

            const isCurrent = st.status === 'current';
            const nodeClass = isCurrent ? 'current' : (st.status === 'departed' ? 'departed' : 'upcoming');

            const stationEl = document.createElement('div');
            stationEl.className = `ls-station ${nodeClass}`;

            // Add train icon to current station
            let trainIconHtml = '';
            if (isCurrent) {
                trainIconHtml = `<div class="ls-train-icon">🚆</div>`;
            }

            // Time logic columns
            const arrHtml = `
              <div class="ls-arr-col">
                <span class="ls-time-val sch">${st.schArr}</span>
                <span class="ls-time-val ${st.actArr !== st.schArr && st.actArr !== '—' ? 'late' : ''}">${st.schArr === '—' ? '' : st.actArr}</span>
              </div>
            `;
            const depHtml = `
              <div class="ls-dep-col">
                <span class="ls-time-val sch">${st.schDep}</span>
                <span class="ls-time-val ${st.actDep !== st.schDep && st.actDep !== '—' ? 'late' : ''}">${st.schDep === '—' ? '' : st.actDep}</span>
              </div>
            `;

            stationEl.innerHTML = `
              ${arrHtml}
              <div class="ls-node-col">
                ${trainIconHtml}
                <div class="ls-station-node"></div>
              </div>
              <div class="ls-info-col">
                <span class="ls-station-name">${st.name}</span>
                <span class="ls-station-meta">${st.km} km <span class="ls-pf-badge">PF ${st.pf || '1'}</span></span>
              </div>
              ${depHtml}
            `;

            lsRoute.appendChild(stationEl);
        });

        // Calculate progress line height based exactly on how many stations have passed.
        if (totalStations > 1) {
            const progressRatio = Math.max(0.01, (currentPassed) / (totalStations - 1));
            const trackLine = lsRoute.querySelector('.ls-track-line');
            if (trackLine) {
                // Approximate 80px per station minimum, minus padding spaces
                trackLine.style.height = `calc(${progressRatio * 100}% - 40px)`;
                if (progressRatio === 0) trackLine.style.height = '0px';
                if (progressRatio === 1) trackLine.style.height = 'calc(100% - 40px)';
            }
        }

        // Scroll gracefully to the current station
        setTimeout(() => {
            const currentEl = lsRoute.querySelector('.ls-station.current');
            if (currentEl) {
                currentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 300);
    }

    function startStatusAutoRefresh() {
        stopStatusAutoRefresh();
        statusRefreshTimer = setInterval(() => {
            if (lsOverlay.classList.contains('open')) {
                fetchTrainStatus();
            }
        }, 120000); // 2 minutes
    }


    function stopStatusAutoRefresh() {
        if (statusRefreshTimer) {
            clearInterval(statusRefreshTimer);
            statusRefreshTimer = null;
        }
    }

    // ─── Leave Chat ───
    leaveBtn.addEventListener('click', () => {
        if (socket) {
            socket.disconnect();
            socket = null;
        }

        // Stop train status auto-refresh
        stopStatusAutoRefresh();

        // Reset and close fullscreen modal
        lsOverlay.classList.remove('open');
        lsLoading.style.display = 'flex';
        lsRouteScroll.style.display = 'none';
        lsFooter.style.display = 'none';

        // Clear chat messages
        chatMessages.innerHTML = `
      <div class="chat-welcome">
        <div class="welcome-icon">🚃</div>
        <p>Welcome aboard! Messages are <strong>not stored</strong> — they exist only while you're here.</p>
      </div>
    `;

        // Reset state
        sessionToken = null;
        roomId = null;
        nickname = null;
        nicknameInput.value = '';

        showScreen('pnr');
        pnrInput.focus();
    });

    // ─── Utility Functions ───
    function scrollToBottom() {
        requestAnimationFrame(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    }

    function formatDate(dateStr) {
        if (!dateStr) return '—';
        try {
            const date = new Date(dateStr + 'T00:00:00');
            return date.toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            });
        } catch {
            return dateStr;
        }
    }

    function formatTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    // ─── Initialize ───
    initParticles();
    pnrInput.focus();
})();

