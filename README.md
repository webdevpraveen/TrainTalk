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

-  No login / no signup
-  No chat storage
-  Real-time messaging using Socket.io
-  Automatic train-based chat rooms
-  Minimal spam protection
-  Privacy-first design
-  Temporary sessions (auto-expire when journey end)

---

## 🔁 How It Works (_Flow_)

1. User opens TrainTalk
2. Enters their **PNR number** (to confirm to joined room)
3. Backend extracts:
   - Train Number
   - Journey Date
4. A temporary chat room is generated:
   `train_<TRAIN_NUMBER>_<DATE>`
   
5. User joins the room and starts chatting
6. Closing the tab disconnects the user
7. No messages are saved anywhere

---

## 🛠 Tech Stack

### Frontend
- **Next.js**
- HTML / CSS 

### Backend
- **Node.js**
- **Express.js**
- **Socket.io**
  
---

## 🔐 Privacy & Safety _Philosophy_

TrainTalk intentionally avoids collecting or storing personal data.

- PNR is used **only for one-time validation**
- PNR is **never stored**
- Messages are not saved
- No user account needed

TrainTalk is designed to be **safe, temporary, and anonymous**.

---

## 🚨 Basic Abuse Prevention System

To keep chats usable:

- Message length limits
- Rate limiting (anti-spam)
- Temporary mute on excessive reports
- No admin, no moderation panel

---

## 🧪 Project Status

🟡 In Development (MVP Stage)

Planned next steps:
  Stable room lifecycle
  Improved spam control
  Coach-based sub rooms (_future_)
  
  ---

## ⚠️ Disclaimer

TrainTalk is an independent experimental project.
It is not affiliated with IRCTC or Indian Railways.

This project is built for educational and fun purposes only.


---
