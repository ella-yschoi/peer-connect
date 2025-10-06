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
  console.log(`