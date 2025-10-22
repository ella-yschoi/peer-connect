import express, { Request, Response } from 'express';
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

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).send('ok');
});

// Handle Socket.io events for WebRTC signaling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join room
  socket.on('join-room', (roomId: string) => {
    socket.join(roomId);
    console.log(`Client ${socket.id} joined room ${roomId}`);

    // Get the number of users in the room
    const room = io.sockets.adapter.rooms.get(roomId);
    const userCount = room ? room.size : 0;

    // Notify the joining client about the number of users in the room
    socket.emit('room-users', userCount);

    // Notify other clients in the room about new user
    socket.to(roomId).emit('user-joined', socket.id);
  });

  // Relay WebRTC signaling messages
  socket.on('signal', ({ roomId, signal, type }) => {
    console.log(`Signal relay: ${type} from ${socket.id} to room ${roomId}`);
    socket.to(roomId).emit('signal', { signal, type, from: socket.id });
  });

  // Handle explicit leave room
  socket.on('leave-room', (roomId: string) => {
    console.log(`🚪 Client ${socket.id} explicitly left room ${roomId}`);
    console.log(`📤 Broadcasting user-left event to room ${roomId}`);
    socket.to(roomId).emit('user-left', socket.id);
    socket.leave(roomId);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);

    // Notify other users in the same rooms that this user left
    socket.rooms.forEach((roomId) => {
      if (roomId !== socket.id) {
        // socket.id is the default room
        socket.to(roomId).emit('user-left', socket.id);
        console.log(`Notified room ${roomId} that user ${socket.id} left`);
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Signaling server running on port ${PORT}`);
});
