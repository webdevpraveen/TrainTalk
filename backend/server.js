const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const apiRoutes = require('./routes/api');
const { initChatHandler } = require('./socket/chatHandler');

// ─── Express Setup ───
const app = express();
const server = http.createServer(app);

// ─── Middleware ───
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ─── Serve Static Frontend ───
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ─── API Routes ───
app.use('/api', apiRoutes);

// ─── Fallback: serve index.html for SPA ───
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ─── Socket.io Setup ───
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

initChatHandler(io);

// ─── Start Server ───
server.listen(config.PORT, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║           🚆  TrainTalk Server  🚆           ║
╠══════════════════════════════════════════════╣
║  Status:  RUNNING                            ║
║  Port:    ${String(config.PORT).padEnd(36)}║
║  URL:     http://localhost:${String(config.PORT).padEnd(19)}║
╚══════════════════════════════════════════════╝
  `);
});
