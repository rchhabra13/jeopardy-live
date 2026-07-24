import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import {
  createRoom,
  getRoom,
  findRoomByHost,
  findRoomByPlayer,
  addPlayer,
  selectClue,
  buzz,
  judge,
  revealAnswer,
  closeClue,
  setScore,
  resetGame,
  markDisconnected,
  sweepRooms,
  stats,
  hostView,
  playerView,
} from './rooms.js';

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.get('/health', (_req, res) => res.json({ ok: true, ...stats() }));

// Single-service mode: if the client has been built, serve it from this same
// process/port. One URL for everything — no CORS, no separate client host.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(path.join(clientDist, 'index.html'))) {
  app.use(express.static(clientDist));
  // SPA fallback so deep links like /play/AB12 work on refresh.
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  console.log('Serving client build from', clientDist);
} else {
  console.log('No client build found — API/socket only (run the Vite dev server separately).');
}

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

// Push the correct (host vs player) view to everyone in a room.
function broadcast(room) {
  io.to(room.hostId).emit('state:update', hostView(room));
  io.to(room.roomCode).except(room.hostId).emit('state:update', playerView(room));
}

io.on('connection', (socket) => {
  socket.on('host:createRoom', ({ board }, cb) => {
    if (!board?.categories?.length) return cb?.({ ok: false, error: 'Invalid board' });
    const room = createRoom(socket.id, board);
    socket.join(room.roomCode);
    cb?.({ ok: true, roomCode: room.roomCode });
    broadcast(room);
  });

  socket.on('player:join', ({ roomCode, name }, cb) => {
    const room = getRoom((roomCode || '').toUpperCase());
    if (!room) return cb?.({ ok: false, error: 'Room not found' });
    socket.join(room.roomCode);
    addPlayer(room, socket.id, name);
    cb?.({ ok: true, roomCode: room.roomCode });
    broadcast(room);
  });

  socket.on('host:selectClue', ({ catIndex, clueIndex }) => {
    const room = findRoomByHost(socket.id);
    if (!room) return;
    selectClue(room, catIndex, clueIndex);
    broadcast(room);
  });

  socket.on('player:buzz', () => {
    const room = findRoomByPlayer(socket.id);
    if (!room) return;
    if (buzz(room, socket.id)) broadcast(room);
  });

  socket.on('host:judge', ({ correct }) => {
    const room = findRoomByHost(socket.id);
    if (!room) return;
    judge(room, !!correct);
    broadcast(room);
  });

  socket.on('host:reveal', () => {
    const room = findRoomByHost(socket.id);
    if (!room) return;
    revealAnswer(room);
    broadcast(room);
  });

  socket.on('host:closeClue', () => {
    const room = findRoomByHost(socket.id);
    if (!room) return;
    closeClue(room);
    broadcast(room);
  });

  socket.on('host:setScore', ({ playerId, score }) => {
    const room = findRoomByHost(socket.id);
    if (!room) return;
    setScore(room, playerId, score);
    broadcast(room);
  });

  socket.on('host:reset', ({ board } = {}) => {
    const room = findRoomByHost(socket.id);
    if (!room) return;
    resetGame(room, board);
    broadcast(room);
  });

  socket.on('disconnect', () => {
    const room = markDisconnected(socket.id);
    if (room) broadcast(room);
  });
});

// Drop abandoned rooms so memory doesn't grow for the life of the process.
const sweeper = setInterval(() => {
  const removed = sweepRooms();
  if (removed) console.log(`Swept ${removed} idle room(s). Now ${stats().rooms} active.`);
}, 60 * 1000);
sweeper.unref();

httpServer.listen(PORT, () => {
  console.log(`Jeopardy server listening on :${PORT}`);
});
