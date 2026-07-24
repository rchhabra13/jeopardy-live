// In-memory room store + game logic. Rooms are lost on restart (fine for v1).

const rooms = new Map();

// socketId -> roomCode, so per-event lookups are O(1) instead of scanning every room.
const socketRoom = new Map();

// A room with nobody connected is dropped after this long, so abandoned games
// don't accumulate in memory for the life of the process.
const EMPTY_TTL_MS = 10 * 60 * 1000;

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no easily-confused chars

function genCode() {
  let code;
  do {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
  } while (rooms.has(code));
  return code;
}

export function createRoom(hostId, board) {
  const roomCode = genCode();
  const room = {
    roomCode,
    hostId,
    board,
    players: {}, // id -> { id, name, score, connected }
    phase: 'board', // 'board' | 'clue' | 'buzzed'
    activeClue: null, // { catIndex, clueIndex }
    buzzedPlayerId: null,
    lockedOut: [], // player ids that already guessed wrong on the active clue
    answerRevealed: false,
    hostConnected: true,
    emptySince: null,
  };
  rooms.set(roomCode, room);
  socketRoom.set(hostId, roomCode);
  return room;
}

function hasLiveSockets(room) {
  if (room.hostConnected) return true;
  return Object.values(room.players).some((p) => p.connected);
}

// Called on every join/disconnect to keep the idle timer accurate.
function refreshEmptyState(room, now = Date.now()) {
  room.emptySince = hasLiveSockets(room) ? null : now;
}

// Periodic cleanup — drops rooms that have had nobody connected for EMPTY_TTL_MS.
export function sweepRooms(now = Date.now()) {
  let removed = 0;
  for (const [code, room] of rooms) {
    if (room.emptySince && now - room.emptySince > EMPTY_TTL_MS) {
      for (const id of Object.keys(room.players)) socketRoom.delete(id);
      socketRoom.delete(room.hostId);
      rooms.delete(code);
      removed++;
    }
  }
  return removed;
}

export const stats = () => ({ rooms: rooms.size, sockets: socketRoom.size });

export function getRoom(roomCode) {
  return rooms.get(roomCode);
}

export function findRoomByHost(hostId) {
  const room = rooms.get(socketRoom.get(hostId));
  return room && room.hostId === hostId ? room : null;
}

export function findRoomByPlayer(socketId) {
  return rooms.get(socketRoom.get(socketId)) || null;
}

export function addPlayer(room, socketId, name) {
  const existing = room.players[socketId];
  room.players[socketId] = {
    id: socketId,
    name: name || existing?.name || 'Player',
    score: existing?.score || 0,
    connected: true,
  };
  socketRoom.set(socketId, room.roomCode);
  refreshEmptyState(room);
  return room.players[socketId];
}

function activeClueObj(room) {
  if (!room.activeClue) return null;
  const { catIndex, clueIndex } = room.activeClue;
  return room.board.categories[catIndex]?.clues[clueIndex] || null;
}

export function selectClue(room, catIndex, clueIndex) {
  const clue = room.board.categories[catIndex]?.clues[clueIndex];
  if (!clue || clue.done) return;
  room.activeClue = { catIndex, clueIndex };
  room.phase = 'clue';
  room.buzzedPlayerId = null;
  room.lockedOut = [];
  room.answerRevealed = false;
}

export function buzz(room, socketId) {
  if (room.phase !== 'clue') return false;
  if (!room.players[socketId]) return false;
  if (room.lockedOut.includes(socketId)) return false;
  room.buzzedPlayerId = socketId;
  room.phase = 'buzzed';
  return true;
}

// correct: +value, clear cell, back to board. wrong: -value, lock player, reopen buzz.
export function judge(room, correct) {
  if (room.phase !== 'buzzed' || !room.buzzedPlayerId) return;
  const player = room.players[room.buzzedPlayerId];
  const clue = activeClueObj(room);
  if (!player || !clue) return;
  if (correct) {
    player.score += clue.value;
    clue.done = true;
    room.activeClue = null;
    room.phase = 'board';
    room.buzzedPlayerId = null;
    room.lockedOut = [];
    room.answerRevealed = false;
  } else {
    player.score -= clue.value;
    room.lockedOut.push(room.buzzedPlayerId);
    room.buzzedPlayerId = null;
    room.phase = 'clue'; // reopen for others
  }
}

export function revealAnswer(room) {
  if (room.activeClue) room.answerRevealed = true;
}

// Host closes a clue nobody got: mark done, return to board.
export function closeClue(room) {
  const clue = activeClueObj(room);
  if (clue) clue.done = true;
  room.activeClue = null;
  room.phase = 'board';
  room.buzzedPlayerId = null;
  room.lockedOut = [];
  room.answerRevealed = false;
}

export function setScore(room, playerId, score) {
  if (room.players[playerId]) room.players[playerId].score = Number(score) || 0;
}

export function resetGame(room, newBoard) {
  if (newBoard) room.board = newBoard;
  for (const cat of room.board.categories) {
    for (const clue of cat.clues) clue.done = false;
  }
  for (const p of Object.values(room.players)) p.score = 0;
  room.phase = 'board';
  room.activeClue = null;
  room.buzzedPlayerId = null;
  room.lockedOut = [];
  room.answerRevealed = false;
}

export function markDisconnected(socketId) {
  const room = findRoomByPlayer(socketId);
  socketRoom.delete(socketId);
  if (!room) return null;
  if (room.players[socketId]) room.players[socketId].connected = false;
  if (room.hostId === socketId) room.hostConnected = false;
  refreshEmptyState(room);
  return room;
}

// ---- Views (what each side is allowed to see) ----

function playersList(room) {
  return Object.values(room.players).map((p) => ({
    id: p.id,
    name: p.name,
    score: p.score,
    connected: p.connected,
  }));
}

// Host sees everything, including answers.
export function hostView(room) {
  return {
    role: 'host',
    roomCode: room.roomCode,
    board: room.board,
    players: playersList(room),
    phase: room.phase,
    activeClue: room.activeClue,
    buzzedPlayerId: room.buzzedPlayerId,
    lockedOut: room.lockedOut,
    answerRevealed: room.answerRevealed,
  };
}

// Players never receive un-revealed answers (would leak via network inspector).
export function playerView(room) {
  const board = {
    title: room.board.title,
    categories: room.board.categories.map((cat, ci) => ({
      title: cat.title,
      clues: cat.clues.map((cl, ii) => {
        const isActive =
          room.activeClue && room.activeClue.catIndex === ci && room.activeClue.clueIndex === ii;
        return {
          value: cl.value,
          done: !!cl.done,
          clue: isActive ? cl.clue : null,
          answer: isActive && room.answerRevealed ? cl.answer : null,
        };
      }),
    })),
  };
  return {
    role: 'player',
    roomCode: room.roomCode,
    board,
    players: playersList(room),
    phase: room.phase,
    activeClue: room.activeClue,
    buzzedPlayerId: room.buzzedPlayerId,
    lockedOut: room.lockedOut,
    answerRevealed: room.answerRevealed,
  };
}
