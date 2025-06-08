const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Serve static files from root directory
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

let playerQueue = [];
let users = {};
let matches = {}; // Track active matches and their rooms

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Assign a username (simple example, could be improved)
  users[socket.id] = `User_${socket.id.substring(0, 4)}`;
  socket.emit('username assigned', users[socket.id]);

  // Handle queue requests
  socket.on('queueMatch', () => {
    console.log(`${users[socket.id]} joined the queue`);
    playerQueue.push(socket.id);
    socket.emit('queueJoined');

    // Check if we have enough players for a match
    if (playerQueue.length >= 2) {
      console.log('Match found!');
      const player1 = playerQueue.shift();
      const player2 = playerQueue.shift();
      
      // Create a unique room for this match
      const roomId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store match information
      matches[roomId] = {
        player1: player1,
        player2: player2,
        createdAt: new Date()
      };
      
      // Join both players to the room
      io.sockets.sockets.get(player1)?.join(roomId);
      io.sockets.sockets.get(player2)?.join(roomId);
      
      // Store room ID in socket data
      if (io.sockets.sockets.get(player1)) {
        io.sockets.sockets.get(player1).roomId = roomId;
      }
      if (io.sockets.sockets.get(player2)) {
        io.sockets.sockets.get(player2).roomId = roomId;
      }
      
      console.log(`Created room ${roomId} for players ${users[player1]} and ${users[player2]}`);
      
      // Notify both players
      io.to(player1).emit('matchFound', { opponent: users[player2], roomId: roomId });
      io.to(player2).emit('matchFound', { opponent: users[player1], roomId: roomId });
    }
  });

  socket.on('words', (data) => {
    // Only broadcast to players in the same room
    if (socket.roomId) {
      socket.to(socket.roomId).emit('wordsReceived', data);
    }
  });



  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    
    // Clean up match if player was in a room
    if (socket.roomId) {
      const roomId = socket.roomId;
      const match = matches[roomId];
      
      if (match) {
        console.log(`Player ${users[socket.id]} disconnected from room ${roomId}`);
        
        // Notify the other player that their opponent disconnected
        socket.to(roomId).emit('opponentDisconnected');
        
        // Clean up the match
        delete matches[roomId];
      }
    }
    
    // Remove the user from the player queue and users list
    delete users[socket.id];
    playerQueue = playerQueue.filter((id) => id !== socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});