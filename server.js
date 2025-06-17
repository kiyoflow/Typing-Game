require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

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
},
function(accessToken, refreshToken, profile, done) {
    // Here you would typically save the user to your database
    return done(null, profile);
}));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
    // Check if player is already in queue
    if (playerQueue.includes(socket.id)) {
      console.log(`${users[socket.id]} is already in queue`);
      socket.emit('alreadyInQueue');
      return;
    }
    
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