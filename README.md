# PeerConnect - WebRTC P2P Video Chat

**Explored WebRTC for real-time media streaming** by building a peer-to-peer video chat with React, TypeScript, and Socket.io.

<br/>

## 🏗️ Architecture

```
[Browser A] ← WebRTC (STUN/TURN) → [Browser B]
        ↕ (Offer/Answer, ICE Candidate exchange)
         [Signaling Server: Express + Socket.io]
```

- **Signaling Server**: Relays Offer/Answer, ICE Candidate messages
- **WebRTC PeerConnection**: Actual audio/video data exchange
- **STUN Server**: Used to find public IP in NAT environments (Google STUN server)

<br/>

## 📦 Tech Stack

### Frontend

- React 18 + TypeScript
- Tailwind CSS
- Socket.io Client
- WebRTC APIs

### Backend

- Node.js + Express
- Socket.io
- TypeScript

<br/>

## 🚀 Getting Started

### 1. Install Dependencies

```bash
# From root directory
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Run Development Server

```bash
# From root directory (runs both server and client)
npm run dev

# Or run individually
npm run server  # Port 3001
npm run client  # Port 3000
```

### 3. Usage

1. Open `http://localhost:3000` in your browser
2. Two users with the same room code are required
3. Allow camera and microphone permissions
4. Real-time video chat through WebRTC P2P connection

<br/>

## 🔑 Key Features

- ✅ **P2P WebRTC Connection**: Direct browser-to-browser media stream exchange
- ✅ **Real-time Signaling**: Offer/Answer, ICE Candidate exchange via Socket.io
- ✅ **Local/Remote Streams**: Camera stream capture and display
- ✅ **Room-based Connection**: Multi-user support via room codes
- ✅ **Connection Status Display**: Real-time connection state monitoring
- ✅ **Responsive UI**: Mobile/desktop support

<br/>

## 📁 Project Structure

```
peerconnect/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/         # Custom hooks (useWebRTC)
│   │   ├── types.ts       # TypeScript type definitions
│   │   └── ...
│   └── package.json
├── server/                 # Express backend
│   ├── index.ts           # Signaling server
│   └── package.json
└── package.json           # Root package configuration
```
