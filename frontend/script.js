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

let socket = null;
let currentUser = '';
let currentRoom = '';

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addMessage(data) {
  const isOwn = data.sender === currentUser;
  const isSystem = data.type === 'system';

  if (isSystem) {
    const systemMsg = document.createElement('div');
    systemMsg.className = 'system-message';
    systemMsg.innerHTML = `<span>${escapeHtml(data.message)}</span>`;
    chatMessages.appendChild(systemMsg);
  } else {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'own' : 'other'}`;
    
    const time = formatTime(new Date(data.timestamp || Date.now()));
    
    messageDiv.innerHTML = `
      ${!isOwn ? `<span class="message-sender">${escapeHtml(data.sender)}</span>` : ''}
      <div class="message-bubble">${escapeHtml(data.message)}</div>
      <span class="message-time">${time}</span>
    `;
    
    chatMessages.appendChild(messageDiv);
  }

  scrollToBottom();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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

function showChat() {
  joinScreen.classList.add('hidden');
  chatScreen.classList.remove('hidden');
  messageInput.focus();
}

function showJoin() {
  chatScreen.classList.add('hidden');
  joinScreen.classList.remove('hidden');
  chatMessages.innerHTML = `
    <div class="welcome-message">
      <p>Welcome aboard! Messages are temporary and will disappear when everyone leaves.</p>
    </div>
  `;
}

function connectSocket() {
  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  socket.on('connect', () => {
    console.log('Connected to server');
    updateConnectionStatus(true);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    updateConnectionStatus(false);
  });

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    updateConnectionStatus(false);
  });

  socket.on('chat-message', (data) => {
    addMessage({
      sender: data.sender,
      message: data.message,
      timestamp: data.timestamp,
      type: 'chat'
    });
  });

  socket.on('system-message', (data) => {
    addMessage({
      message: data.message,
      type: 'system'
    });

    if (data.passengers !== undefined) {
      updatePassengerCount(data.passengers);
    }
  });

  socket.on('room-info', (data) => {
    if (data.passengers !== undefined) {
      updatePassengerCount(data.passengers);
    }
  });
}

function updatePassengerCount(count) {
  passengersCount.textContent = `${count} passenger${count !== 1 ? 's' : ''}`;
}

function joinRoom(nickname, roomId) {
  currentUser = nickname;
  currentRoom = roomId;
  
  roomTitle.textContent = roomId;
  
  if (!socket || !socket.connected) {
    connectSocket();
    socket.on('connect', () => {
      socket.emit('join-room', { nickname, roomId });
    });
  } else {
    socket.emit('join-room', { nickname, roomId });
  }
  
  showChat();
}

function leaveRoom() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  currentUser = '';
  currentRoom = '';
  showJoin();
}

function sendMessage(message) {
  if (!socket || !socket.connected) {
    console.error('Not connected to server');
    return;
  }

  socket.emit('send-message', {
    message: message,
    sender: currentUser,
    roomId: currentRoom
  });

  addMessage({
    sender: currentUser,
    message: message,
    timestamp: Date.now(),
    type: 'chat'
  });
}

joinForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const nickname = nicknameInput.value.trim();
  const roomId = roomIdInput.value.trim();
  
  if (nickname && roomId) {
    joinRoom(nickname, roomId);
  }
});

messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const message = messageInput.value.trim();
  
  if (message) {
    sendMessage(message);
    messageInput.value = '';
    messageInput.focus();
  }
});

leaveBtn.addEventListener('click', () => {
  leaveRoom();
});

messageInput.addEventListener('input', () => {
  sendBtn.disabled = !messageInput.value.trim();
});

sendBtn.disabled = true;
