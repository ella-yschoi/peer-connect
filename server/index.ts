import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);
const allowedOrigins = (process.env.CORS_ORIGIN || '*').split(',');
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).send('ok');
});

// Handle Socket.io events for WebRTC signaling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join room
  socket.on('join-room', (roomId: string) => {
    socket.join(roomId);
    console.log(`Client ${socket.id} joined room ${roomId}`);

    // Notify other clients in the room about new user
    socket.to(roomId).emit('user-joined', socket.id);
  });

  // Relay WebRTC signaling messages
  socket.on('signal', ({ roomId, signal, type }) => {
    console.log(`Signal relay: ${type} from ${socket.id} to room ${roomId}`);
    socket.to(roomId).emit('signal', { signal, type, from: socket.id });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Signaling server running on port ${PORT}`);
});
