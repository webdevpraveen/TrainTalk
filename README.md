# 🚆 TrainTalk

**TrainTalk** is a zero-login, zero-storage, real-time chat application for train passengers.  
Passengers traveling on the same train can instantly join a shared chat room using their PNR and talk in real time during the journey.

No accounts.  
No chat history.  
No digital footprint.  
Just passengers, sharing a journey.


---

## 🧠 Idea Behind TrainTalk

Train journeys create a unique temporary community.  
TrainTalk is built around this idea:

> “People sharing the same journey should be able to talk — without friction.”

TrainTalk is **ephemeral by design**:
- Chats exist only during the journey
- Closing the tab means leaving the chat
- When the train journey ends, the chat room disappears

This is not a social network.  
This is a **moment-based communication tool**.

---

## ✨ Key Features

-  **Zero Setup**: No login, no signup, no accounts required.
-  **Zero Storage**: PNRs are verified and discarded. Messages are never saved, persisted, or logged.
-  **Real-Time Live Train Status**: Check your train's live arrival, departure, and delay information in a beautiful, dynamic native-app style modal.
-  **Automatic Rooms**: Rooms are generated automatically based on your Train Number and Journey Date.
-  **Premium UI**: Features a sleek glassmorphism design, dark mode chat, and animated live tracking timelines.
-  **Anonymity-First**: Chat using a temporary nickname.
-  **Spam Protection**: Message rate limiting, PNR verification rate-limiting, and max connection caps.

---

## 🔁 How It Works (_Flow_)

1. User opens TrainTalk
2. Enters their 10-digit **PNR**
3. Backend verifies the PNR securely via **RapidAPI IRCTC api**
4. Backend extracts:
   - Train Number
   - Journey Date
5. A temporary, secure session token is assigned to the client.
6. A temporary chat room is generated:
   `train_<TRAIN_NUMBER>_<DATE>`
7. User joins the room and starts chatting.
8. User can check the **Live Train Status** natively inside the chat room.
9. Disconnecting from the socket automatically leaves the room. No history is kept.

---

## 🛠 Tech Stack

### Frontend
- HTML5
- CSS3 (Custom properties, Flexbox/Grid, Animations, Glassmorphism)
- Vanilla JavaScript
- Socket.io-client

### Backend
- **Node.js**
- **Express.js**
- **Socket.io** (WebSockets)
- **Axios** (for RapidAPI calls)

---

## 🔐 Privacy & Safety _Philosophy_

TrainTalk intentionally avoids collecting or storing personal data.

- PNR is used **only for one-time validation**
- PNR is **never stored**
- Messages are not saved
- No user account or identifying data needed
- UUID-based temporary memory sessions ensure connection validity without persistence.

TrainTalk is designed to be **safe, temporary, and anonymous**.

---

## 🚨 Abuse Prevention & Security

To keep chats usable and secure, the system enforces:
- **Rate limiting (PNR)**: Max 5 validations per hour per IP.
- **Message limits**: 1 message per second.
- **Connection caps**: 1 active socket per session to prevent multi-tab spamming.
- **Length limits**: Messages are capped at 500 characters.

---

## ⚙️ How to Run Locally

You will need a RapidAPI key from the IRCTC API (or you can use the built-in developer dummy PNRs like `1111111111`).

```bash
# 1. Clone the repository
git clone https://github.com/webdevpraveen/TrainTalk.git

# 2. Setup environment
cp .env.example .env
# Edit .env and add your RAPIDAPI_KEY

# 3. Install dependencies & start
cd backend
npm install
npm run dev

# The server will run at http://localhost:3000
```

---

## ⚠️ Disclaimer

TrainTalk is an independent experimental project.  
It is **not** affiliated with IRCTC or Indian Railways.

This project is built for educational and fun purposes only.
