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
      
      // Notify both players
      io.to(player1).emit('matchFound', { opponent: users[player2] });
      io.to(player2).emit('matchFound', { opponent: users[player1] });
    }
  });

  socket.on('words', (data) => {
    // Broadcast the words to all clients except the sender
    socket.broadcast.emit('wordsReceived', data);
  });




  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    // Remove the user from the player queue and users list
    delete users[socket.id];
    playerQueue = playerQueue.filter((id) => id !== socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});