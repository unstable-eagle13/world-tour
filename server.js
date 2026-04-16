const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Game state lives here on the server ──
let gameState = defaultState();

function defaultState() {
  return {
    joined: {},
    gameStarted: false,
    roundIndex: -1,
    phase: 'lobby',
    scores: { felipe: 0, rave: 0, burns: 0 },
    answers: {},
    buzzed: null,
    jepUsed: {},
    currentQ: null,
    drawData: null
  };
}

io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  // Send current state to new connection
  socket.emit('state', gameState);

  // Client asks for full state
  socket.on('getState', () => {
    socket.emit('state', gameState);
  });

  // Client sends a full state patch
  socket.on('patch', (patch) => {
    gameState = { ...gameState, ...patch };
    // Broadcast updated state to ALL clients (including sender)
    io.emit('state', gameState);
  });

  // Client sends a single key update (more efficient for frequent updates like drawing)
  socket.on('set', ({ key, value }) => {
    gameState[key] = value;
    io.emit('state', gameState);
  });

  // Reset game
  socket.on('reset', () => {
    gameState = defaultState();
    io.emit('state', gameState);
    console.log('Game reset');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`World Tour running on port ${PORT}`);
});
