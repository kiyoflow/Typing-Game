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
let privateRooms = {}; // NOTE: room.players is now an array of {username, socketId} objects.

function handlePlayerLeavingPrivateRoom(socket, privateRoomId) {
    const room = privateRooms[privateRoomId];
    if (!room || !socket.user) {
        return;
    }

    // Find the player in the room by their specific, unique socket ID.
    const playerIndex = room.players.findIndex(p => p.socketId === socket.id);

    // If this specific connection isn't on the list, do nothing.
    // This is the core fix that prevents stale disconnects from removing a reconnected player.
    if (playerIndex === -1) {
        return;
    }

    const username = room.players[playerIndex].username;
    console.log(`${username} (socket ${socket.id}) left private room ${privateRoomId}`);

    const wasOwner = room.creator === username;
    // Remove the player from the list using their index.
    room.players.splice(playerIndex, 1);
    
    socket.leave(privateRoomId);

    if (room.players.length === 0) {
        // Set a timer to delete the room, allowing for reconnections.
        room.deletionTimer = setTimeout(() => {
            if (privateRooms[privateRoomId] && privateRooms[privateRoomId].players.length === 0) {
              delete privateRooms[privateRoomId];
              console.log(`DELETED private room ${privateRoomId} after grace period.`);
            }
        }, 10000); // 10-second grace period.
    } else {
        const eventData = {
            username: username,
            players: room.players.map(p => p.username),
            playerCount: room.players.length
        };

        if (wasOwner) {
            const newOwner = room.players[0].username;
            const newOwnerSocketId = room.players[0].socketId;
            room.creator = newOwner;
            console.log(`Promoting ${newOwner} to host of room ${privateRoomId}`);
            
            eventData.newOwner = newOwner;

            if (newOwnerSocketId) {
                io.to(newOwnerSocketId).emit('ownershipResult', { isOwner: true });
            }
        }

        // Notify remaining players. newOwner is only attached if it changed.
        io.to(privateRoomId).emit('playerLeft', eventData);
    }
}

io.on('connection', (socket) => {
  socket.on('userData', (userData) => {
    // We no longer store the full socket object, only the user's data.
    // The socket.id is the key, which is all we need.
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
      const matchWords = getRandomWords(25); // Generate 25 random words for the match
      
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

  // Handle a player finishing the race
  socket.on('playerFinished', () => {
    const roomId = socket.roomId;
    if (!roomId || !matches[roomId]) return;

    const match = matches[roomId];
    const winnerId = socket.id;
    
    // Determine the loser's ID
    const loserId = (winnerId === match.player1) ? match.player2 : match.player1;

    // Get winner's name
    const winnerName = users[winnerId] ? users[winnerId].displayName : 'Winner';

    // Notify both players that the race is over, and who won.
    io.to(roomId).emit('raceOver', { winnerId: winnerId, winnerName: winnerName });
    
    // Clean up the match from memory
    delete matches[roomId];
  });
  
  socket.on('typingProgress', (data) => {
    // Only broadcast to players in the same room
    if (socket.roomId) {
      socket.to(socket.roomId).emit('typingProgressReceived', data);
    }
  });

  socket.on('privateMatchProgress', (data) => {
    const privateRoomId = socket.roomId;
    const room = privateRooms[privateRoomId];
    const username = socket.user.displayName;
    
    if (room && room.matchData && room.matchData.playerStats[username]) {
      const currentStats = room.matchData.playerStats[username];
      
      // If player is already finished, don't recalculate WPM (it would go down as time increases)
      if (currentStats.finished) {
        // Only update progress if they're still typing (shouldn't happen but just in case)
        room.matchData.playerStats[username] = {
          ...currentStats,
          progress: data.progress,
          totalChars: data.totalChars
        };
      } else {
      // Calculate elapsed time since match started
      const elapsed = new Date() - room.matchData.startTime;
      const elapsedMinutes = elapsed / 60000;
      
      // Calculate WPM and accuracy
      const wordsTyped = data.progress / 5; // Standard: 5 chars = 1 word
      const wpm = elapsedMinutes > 0 ? Math.round(wordsTyped / elapsedMinutes) : 0;
      // Fix accuracy calculation to match client-side calculation
      const accuracy = data.totalChars > 1 ? Math.min(Math.round((data.progress / (data.totalChars - 1)) * 100), 100) : 0;
      
      // Update player stats
      room.matchData.playerStats[username] = {
        progress: data.progress,
        totalChars: data.totalChars,
        wpm: wpm,
        accuracy: accuracy,
        finished: data.finished,
        finishTime: data.finished ? new Date() : null,
        finalWpm: data.finalWpm || (data.finished ? wpm : 0),
        finalAccuracy: data.finalAccuracy || (data.finished ? accuracy : 0)
      };
      }
      
      // Check if all players have finished or if time has run out for one player
      const allPlayers = Object.keys(room.matchData.playerStats);
      const finishedPlayers = allPlayers.filter(player => room.matchData.playerStats[player].finished);
      
      // End the match if time ran out OR if all players finished normally.
      if (!room.matchData.isOver && (data.reason === 'time_up' || finishedPlayers.length === allPlayers.length)) {
        if (data.reason === 'time_up') {
          console.log(`Timer ran out for room ${privateRoomId}. Forcing match end.`);
        } else {
          console.log(`All players finished in room ${privateRoomId}. Emitting matchEnded event.`);
        }
        
        room.matchData.isOver = true; // Prevent this from firing multiple times
        io.to(privateRoomId).emit('privateMatchEnded', {
          finalRankings: room.matchData.playerStats
        });
      }
      
      // If the match is still ongoing, send a leaderboard update.
      if (!room.matchData.isOver) {
          io.to(privateRoomId).emit('leaderboardUpdate', {
              playerStats: room.matchData.playerStats
          });
      }
    }
  });

  socket.on('disconnect', () => {
    const username = socket.user ? socket.user.displayName : socket.id;
    console.log('A user disconnected:', username);

    const roomId = socket.roomId;
    if (roomId) {
      if (matches[roomId]) {
        console.log(`Player ${username} disconnected from public match ${roomId}`);
        socket.to(roomId).emit('opponentDisconnected');
        delete matches[roomId];
      } else if (privateRooms[roomId]) {
        // This is a private match. Let the handler figure out if the disconnect is stale.
        handlePlayerLeavingPrivateRoom(socket, roomId);
      }
    }
    
    // Remove the user from the global users list and matchmaking queue
    delete users[socket.id];
    playerQueue = playerQueue.filter((id) => id !== socket.id);
  });

    socket.on('createPrivateRoom', () => {
      const privateRoomId = generatePrivateRoomId();
      privateRooms[privateRoomId] = {
        creator: socket.user.displayName,
        createdAt: new Date(),
        players: [{ username: socket.user.displayName, socketId: socket.id }] // Start with the new player object structure.
      };
      
      // Join the creator to the room
      socket.join(privateRoomId);
      socket.roomId = privateRoomId; // Correctly track the room ID
      
      socket.emit('privateRoomCreated', privateRoomId);
  });


  socket.on('checkOwnership', (data) => {
    const privateRoomId= data.privateRoomId;
    if (privateRoomId && socket.user) {
      const isOwner = privateRooms[privateRoomId].creator === socket.user.displayName;
      socket.emit('ownershipResult', { isOwner: isOwner });
    }
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

    // The ONLY responsibility of this event is to tell the client to navigate to the new page.
    // The client will then emit 'getRoomPlayers' upon loading the new page,
    // which is the single, reliable source of truth for adding a player.
    if (roomInfo && socket.user) {
      socket.emit('redirectToRoom', privateRoomId);
    }
  });

  socket.on('rejectInvite', (data) => {
    const privateRoomId = data.privateRoomId;
    console.log(`Invite rejected for room ${privateRoomId}`);
  });

  socket.on('getRoomPlayers', (privateRoomId) => {
    const room = privateRooms[privateRoomId];
    if (room && socket.user) {
        socket.join(privateRoomId);
        socket.roomId = privateRoomId;

        const username = socket.user.displayName;
        const playerIndex = room.players.findIndex(p => p.username === username);

        let justJoined = false;
        // If player is already in the list, update their socketId. Otherwise, add them.
        if (playerIndex !== -1) {
            room.players[playerIndex].socketId = socket.id;
        } else {
            room.players.push({ username: username, socketId: socket.id });
            justJoined = true; // Flag that this is a new player joining the room.
        }

        // If the room was about to be deleted, cancel the timer because someone rejoined.
        if (room.deletionTimer) {
            clearTimeout(room.deletionTimer);
            delete room.deletionTimer;
            console.log(`Cancelled room deletion for ${privateRoomId} because a player rejoined.`);
        }

        // We always send 'playerJoined' so the new person gets the list.
        // If it was a new join, this also notifies everyone else.
        io.to(privateRoomId).emit('playerJoined', {
            players: room.players.map(p => p.username),
            playerCount: room.players.length
        });
    }
  });

  socket.on('updatePrivateRoomWordCount', (data) => {
    socket.to(data.privateRoomId).emit('privateRoomWordCountChanged', data.wordCount);
  })

  socket.on('leavePrivateRoom', (data) => {
    const privateRoomId = data.privateRoomId;
    // The socket object itself provides all the context we need.
    // Call the canonical handler to ensure logic is consistent.
    handlePlayerLeavingPrivateRoom(socket, privateRoomId);
  });

  socket.on('privateMatchStarted', (data) => {
    const privateRoomId = data.privateRoomId;
    const wordCount = data.wordCount || 25;
    const room = privateRooms[privateRoomId];
    
    if (room) {
      // If a previous match exists, delete its data to reset the state.
      if (room.matchData) {
        delete room.matchData;
      }

      const matchWords = getRandomWords(wordCount);

      // Initialize match data when the match STARTS
      room.matchData = {
        totalWords: wordCount,
        startTime: new Date(),
        playerStats: {},
        isOver: false
      };
      
      // Add all players in the room to playerStats by username.
      room.players.forEach(player => {
        room.matchData.playerStats[player.username] = {
          progress: 0,
          totalChars: 0,
          wpm: 0,
          accuracy: 0,
          finished: false,
          finishTime: null,
          finalWpm: 0,
          finalAccuracy: 0
        };
      });
      
      console.log(`Match started for room ${privateRoomId} with players:`, Object.keys(room.matchData.playerStats));
      
      // Store room ID in all sockets in this room for typing progress
      const socketsInRoom = io.sockets.adapter.rooms.get(privateRoomId);
      if (socketsInRoom) {
        socketsInRoom.forEach(socketId => {
          const socket = io.sockets.sockets.get(socketId);
          if (socket) {
            socket.roomId = privateRoomId;
          }
        });
      }
      
      io.to(privateRoomId).emit('privateMatchStarted', {words: matchWords, players: room.players.map(p => p.username)});
      
      // Send initial leaderboard with all players at 0 WPM/accuracy
      io.to(privateRoomId).emit('leaderboardUpdate', {
        playerStats: room.matchData.playerStats
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
