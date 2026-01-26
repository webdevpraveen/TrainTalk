const SOCKET_URL = 'http://localhost:4000';

const joinScreen = document.getElementById('join-screen');
const chatScreen = document.getElementById('chat-screen');
const joinForm = document.getElementById('join-form');
const nicknameInput = document.getElementById('nickname');
const roomIdInput = document.getElementById('room-id');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const chatMessages = document.getElementById('chat-messages');
const roomTitle = document.getElementById('room-title');
const passengersCount = document.getElementById('passengers-count');
const leaveBtn = document.getElementById('leave-btn');
const connectionStatus = document.getElementById('connection-status');
const sendBtn = document.getElementById('send-btn');

const trainNoInput = document.getElementById('train-no');
const dateInput = document.getElementById('journey-date');

let socket = null;
let currentUser = '';
let currentRoom = '';

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function updatePassengerCount(count) {
  passengersCount.textContent = `${count} passenger${count !== 1 ? 's' : ''}`;
}

function addChatMessage(username, message) {
  const isOwn = username === currentUser;

  const div = document.createElement('div');
  div.className = `message ${isOwn ? 'own' : 'other'}`;

  div.innerHTML = `
    ${!isOwn ? `<span class="message-sender">${escapeHtml(username)}</span>` : ''}
    <div class="message-bubble">${escapeHtml(message)}</div>
  `;

  chatMessages.appendChild(div);
  scrollToBottom();
}

function addSystemMessage(text) {
  const div = document.createElement('div');
  div.className = 'system-message';
  div.innerHTML = `<span>${escapeHtml(text)}</span>`;
  chatMessages.appendChild(div);
  scrollToBottom();
}

function updateConnectionStatus(connected) {
  if (connected) {
    connectionStatus.classList.remove('disconnected');
    connectionStatus.querySelector('.status-text').textContent = 'Connected';
  } else {
    connectionStatus.classList.add('disconnected');
    connectionStatus.querySelector('.status-text').textContent = 'Disconnected';
  }
}

function buildRoomId() {
  const trainNo = trainNoInput?.value.trim();
  const date = dateInput?.value;
  if (trainNo && date) {
    return `train_${trainNo}_${date}`;
  }
  return roomIdInput.value.trim();
}

function connectSocket() {
  socket = io(SOCKET_URL);

  socket.on('connect', () => updateConnectionStatus(true));
  socket.on('disconnect', () => updateConnectionStatus(false));

  socket.on('chat-message', (data) => {
    addChatMessage(data.username, data.message);
  });

  socket.on('system-message', (data) => {
    addSystemMessage(data.message);
    if (data.passengers !== undefined) {
      updatePassengerCount(data.passengers);
    }
  });
}

function joinRoom(username, roomId) {
  currentUser = username;
  currentRoom = roomId;

  roomTitle.textContent = roomId;

  connectSocket();

  socket.on('connect', () => {
    socket.emit('join-room', {
      roomId: currentRoom,
      username: currentUser
    });
  });

  joinScreen.classList.add('hidden');
  chatScreen.classList.remove('hidden');
  messageInput.focus();
}

function leaveRoom() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  chatMessages.innerHTML = `
    <div class="welcome-message">
      <p>Welcome aboard! Messages are temporary and will disappear when everyone leaves.</p>
    </div>
  `;

  chatScreen.classList.add('hidden');
  joinScreen.classList.remove('hidden');
}

function sendMessage() {
  const message = messageInput.value.trim();
  if (!message || !socket) return;

  socket.emit('send-message', {
    roomId: currentRoom,
    username: currentUser,
    message
  });

  messageInput.value = '';
}

joinForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const nickname = nicknameInput.value.trim();
  const roomId = buildRoomId();

  if (!nickname || !roomId) return;

  joinRoom(nickname, roomId);
});

messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  sendMessage();
});

leaveBtn.addEventListener('click', leaveRoom);

window.addEventListener('beforeunload', () => {
  if (socket) socket.disconnect();
});

messageInput.addEventListener('input', () => {
  sendBtn.disabled = !messageInput.value.trim();
});

sendBtn.disabled = true;
