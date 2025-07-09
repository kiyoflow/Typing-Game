require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const axios = require('axios');
const words = require('./public/words.js');

// Validate required environment variables
const requiredEnvVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'SESSION_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars);
    console.error('Please set these environment variables in Azure App Service Configuration');
    // Don't exit in production, let it try to continue
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
}

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || process.env.WEBSITES_PORT || 3000;

function getRandomWords(count) {
  const selectedWords = [];
  for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * words.length);
      selectedWords.push(words[randomIndex]);
  }
  return selectedWords;
}

function generatePrivateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let roomId = '';
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    roomId += chars[randomIndex];
  }
  return roomId;
}

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback" 
    //callbackURL: "https://typing-game.azurewebsites.net/auth/google/callback"
},
function(accessToken, refreshToken, profile, done) {
    // Here you would typically save the user to your database
    return done(null, profile);
}));

app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        res.redirect('/login');
    }
});

app.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/');
    } else {
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
    }
});

// Auth routes
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
        res.redirect('/');
    }
);

app.get('/auth/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});

// Check auth status
app.get('/auth/status', (req, res) => {
    res.json({ 
        authenticated: req.isAuthenticated(),
        user: req.user
    });
});

// Protected route for private match page
app.get('/privatematch.html', (req, res) => {
    if (req.isAuthenticated()) {
        res.sendFile(path.join(__dirname, 'public', 'privatematch.html'));
    } else {
        res.redirect('/login');
    }
});

// Proxy route for Google profile images
app.get('/proxy-image', async (req, res) => {
    const imageUrl = req.query.url;
    if (!imageUrl) {
        return res.status(400).send('No image URL provided');
    }

    try {
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer'
        });
        res.set('Content-Type', response.headers['content-type']);
        res.send(response.data);
    } catch (error) {
        console.error('Error proxying image:', error);
        res.status(500).send('Error loading image');
    }
});

// Serve static files from public directory (moved after routes to prevent bypassing route handlers)
app.use(express.static(path.join(__dirname, 'public')));

let playerQueue = [];
let users = {};
let matches = {}; // Track active matches and their rooms
let privateRooms = {};

io.on('connection', (socket) => {
  socket.on('userData', (userData) => {
    users[socket.id] = userData;
    socket.user = userData; // Store user data directly on socket
    console.log(`${userData.displayName} connected`);
    
    // No need to check queue status on connection anymore
    // Let the queueMatch handler deal with duplicates
  });

  // Handle queue requests
  socket.on('queueMatch', () => {
    const username = socket.user ? socket.user.displayName : socket.id;
    
    // Check if player is already in queue by display name
    const isAlreadyInQueue = playerQueue.some(socketId => {
      const queuedUser = users[socketId];
      return queuedUser && queuedUser.displayName === username;
    });
    
    if (isAlreadyInQueue) {
      console.log(`${username} is already in queue`);
      socket.emit('queueRejected');
      return;
    }
    
    console.log(`${username} joined the queue`);
    playerQueue.push(socket.id);
    socket.emit('queueJoined');
    

    // Check if we have enough players for a match
    if (playerQueue.length >= 2) {
      console.log('Match found!');
      const player1 = playerQueue.shift();
      const player2 = playerQueue.shift();
      
      const player1Name = users[player1] ? users[player1].displayName : player1;
      const player2Name = users[player2] ? users[player2].displayName : player2;
      
      // Create a unique room for this match
      const roomId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Generate random words for this match
      const matchWords = getRandomWords(25); // Generate 50 random words for the match
      
      // Store match information
      matches[roomId] = {
        player1: player1,
        player2: player2,
        words: matchWords,
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
      
      console.log(`Created room ${roomId} for players ${player1Name} and ${player2Name}`);
      
      // Notify both players with match info and words
      io.to(player1).emit('matchFound', { opponent: player2Name, roomId: roomId, words: matchWords });
      io.to(player2).emit('matchFound', { opponent: player1Name, roomId: roomId, words: matchWords });
    }
  });


  socket.on('leaveQueue', () => {
    const username = socket.user ? socket.user.displayName : socket.id;
    
    console.log(`${username} left the queue`);
    playerQueue = playerQueue.filter((id) => id !== socket.id);
  });

  // Handle game over
  socket.on('raceOver', (data) => {
    socket.to(socket.roomId).emit('raceOver', data);
  });
  
  socket.on('typingProgress', (data) => {
    // Only broadcast to players in the same room
    if (socket.roomId) {
      socket.to(socket.roomId).emit('typingProgressReceived', data);
    }
  });

  socket.on('disconnect', () => {
    const username = socket.user ? socket.user.displayName : socket.id;
    console.log('A user disconnected:', username);
    
    // Clean up match if player was in a room
    if (socket.roomId) {
      const roomId = socket.roomId;
      const match = matches[roomId];
      
      if (match) {
        console.log(`Player ${username} disconnected from room ${roomId}`);
        
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

    socket.on('createPrivateRoom', () => {
    const privateRoomId = generatePrivateRoomId();
    privateRooms[privateRoomId] = {
      creator: socket.user.displayName,
      createdAt: new Date(),
      players: [socket.user.displayName]
    };
    
    // Join the creator to the room
    socket.join(privateRoomId);
    
    socket.emit('privateRoomCreated', privateRoomId);
  });

  socket.on('invitePlayer', (data) => {
    for (user in users){
      if (users[user].displayName === data.invitee){
        io.to(user).emit('inviteReceived', {
          inviter: data.inviter, 
          privateRoomId: data.privateRoomId
        });
      }
    }
  });

  socket.on('acceptInvite', (data) => {
    const privateRoomId = data.privateRoomId;
    const roomInfo = privateRooms[privateRoomId];

    if (roomInfo && socket.user) {
      // Add player to room players array
      if (!roomInfo.players.includes(socket.user.displayName)) {
        roomInfo.players.push(socket.user.displayName);
      }

      // Join the invited player to the room
      socket.join(privateRoomId);
      
      // Send redirect to the accepting player
      socket.emit('redirectToRoom', privateRoomId);

      // Update all players in the room
      io.to(privateRoomId).emit('playerJoined', {
        players: roomInfo.players,
        playerCount: roomInfo.players.length
      });
    }
  });

  socket.on('rejectInvite', (data) => {
    const privateRoomId = data.privateRoomId;
    console.log(`Invite rejected for room ${privateRoomId}`);
  });

  socket.on('getRoomPlayers', (roomId) => {
    const room = privateRooms[roomId];
    if (room) {
      socket.emit('playerJoined', {
        players: room.players,
        playerCount: room.players.length
      });
    }
  });
});

  


server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
