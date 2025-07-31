require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const axios = require('axios');
const sql = require('mssql');
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

const sqlConfig = {
  user: process.env.MSSQL_USER,
  password: process.env.MSSQL_PASSWORD,
  database: process.env.MSSQL_DATABASE,
  server: process.env.MSSQL_SERVER,
  options: {
      encrypt: true, // for Azure
      trustServerCertificate: false
  }
};

async function connectToDatabase() {
  try {
    await sql.connect(sqlConfig);
    console.log('Connected to database');
  } catch (error) {
    console.error('Error connecting to database:', error);
  }
}

connectToDatabase();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Add JSON body parsing middleware
app.use(express.json());

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
async function(accessToken, refreshToken, profile, done) {
    // No MSSQL logic, just pass 
    const email = profile.emails[0].value;
    const username = profile.displayName;
    const googleId = profile.id

    const emailRequest = new sql.Request();
    emailRequest.input('email', sql.NVarChar, email);
    const emailResult = await emailRequest.query(`SELECT * FROM Users WHERE Email = @email`);

    if (emailResult.recordset.length > 0) {
      console.log('Logging in with existing account');
      // Check if existing user needs setup
      const existingUser = emailResult.recordset[0];
      if (!existingUser.account_setup_complete) {
        profile.needsSetup = true;
      }
    } else {
      console.log('Creating new account');
      const createRequest = new sql.Request();
      createRequest.input('email', sql.NVarChar, email);
      createRequest.input('username', sql.NVarChar, username);
      createRequest.input('googleId', sql.NVarChar, googleId)
      await createRequest.query(`INSERT INTO Users (Email, Username, Creation_Date, googleId, account_setup_complete) VALUES (@email, @username, GETDATE(), @googleId, 0)`);
      profile.needsSetup = true;
    }
    return done(null, profile);
}));

app.get('/api/profileDashboard', async function loadProfile(req, res) {
  if (req.isAuthenticated()) {
    try {
      const email = req.user.emails[0].value;
      const profilePicture = req.user.photos[0].value;

      // get user data based on their email
      const dataRequest = new sql.Request();
      dataRequest.input('email', sql.NVarChar, email);
      const dataResult = await dataRequest.query(`SELECT * FROM Users WHERE Email = @email`);
      const userData = dataResult.recordset[0];

      res.json({
        username: userData.Username,
        creationDate: userData.Creation_Date,
        profilePicture: profilePicture,
        totalTypingTime: userData.total_seconds_typed || 0,
        practiceTestsCompleted: userData.practiceTestsCompleted || '-'
      });
    } catch (error) {
      console.error('Error getting profile data:', error);
      res.status(500).json({ error: 'Error getting profile data' });
    }
  } else {
    res.status(401).json({ error: 'Not logged in' });
  }
});



app.post('/api/updateTypingTime', async (req, res) => {
  console.log('updateTypingTime endpoint hit');
  console.log('Request body:', req.body);
  console.log('Is authenticated:', req.isAuthenticated());
  
  if (req.isAuthenticated()) {
    try {
      const timeTyped = req.body.timeTyped;
      const email = req.user.emails[0].value;
      
      console.log('Updating typing time:', timeTyped, 'seconds for email:', email);

      const updateTypingTimeRequest = new sql.Request();
      updateTypingTimeRequest.input('email', sql.NVarChar, email);
      updateTypingTimeRequest.input('timeTyped', sql.Int, timeTyped);
      
      console.log('About to run SQL query...');
      await updateTypingTimeRequest.query(`UPDATE Users SET total_seconds_typed = ISNULL(total_seconds_typed, 0) + @timeTyped WHERE Email = @email`);
      
      console.log('SQL query completed successfully');
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating typing time:', error);
      console.error('Error details:', error.message);
      res.status(500).json({ error: 'Error updating typing time', details: error.message });
    }
  } else {
    console.log('User not authenticated');
    res.status(401).json({ error: 'Not logged in' });
  }
})

app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        if (req.user.needsSetup) {
            // User needs setup, redirect to setup page
            res.sendFile(path.join(__dirname, 'public', 'setup.html'));
        } else {
            // Normal game page
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        }
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
app.get('/auth/status', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const email = req.user.emails[0].value;
            const dataRequest = new sql.Request();
            dataRequest.input('email', sql.NVarChar, email);
            const dataResult = await dataRequest.query(`SELECT Username FROM Users WHERE Email = @email`);
            const userData = dataResult.recordset[0];
            
            res.json({ 
                authenticated: true,
                user: {
                    username: userData.Username,
                    profilePicture: req.user.photos[0].value
                }
            });
        } catch (error) {
            console.error('Error getting user data for auth status:', error);
            res.status(500).json({ error: 'Failed to get user data' });
        }
    } else {
        res.json({ 
            authenticated: false,
            user: null
        });
    }
});

// Profile route with username in URL
app.get('/profile/:username', (req, res) => {
    if (req.isAuthenticated()) {
        res.sendFile(path.join(__dirname, 'public', 'fullProfile.html'));
    } else {
        res.redirect('/login');
    }
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

 app.get(`/api/userprofile`, async (req, res) => {  
  const email = req.user.emails[0].value;
  let profilePicture = req.user.photos[0].value;

  // Modify the URL to request a larger image size (e.g., 512px)
  if (profilePicture.includes('googleusercontent.com')) {
    profilePicture = profilePicture.replace(/=s\d+.*$/, '=s512');
  }

  const usersRequest = new sql.Request();
  usersRequest.input('email', sql.NVarChar, email);
  // Make sure to select the correct column from your database
  const usersResult = await usersRequest.query(`SELECT * FROM Users WHERE Email = @email`);
    
  if (usersResult.recordset.length === 0) {
    res.status(404).json({ error: 'User not found' });
   }
  
  const userData = usersResult.recordset[0];
  res.json({
    username: userData.Username,
    profilePicture: profilePicture,
    creationDate: userData.Creation_Date,
    totalTypingTime: userData.total_seconds_typed || 0, // FIX: Send a number (0) as the default
    practiceTestsCompleted: userData.practiceTestsCompleted || 0,
    pvpWins: userData.pvp_wins || 0,
    best5WordWpm: userData['5_words_wpm'] || '-',
    best10WordWpm: userData['10_words_wpm'] || '-',
    best25WordWpm: userData['25_words_wpm'] || '-',
    best50WordWpm: userData['50_words_wpm'] || '-',
    bestPvpWpm: userData['pvp_best_wpm'] || '-'
  });
})


app.post('/api/incrementPracticeTestsCompleted', async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: 'Not logged in' });
    return;
  }
  try {
    const email = req.user.emails[0].value;
    const updateTestsCompletedRequest = new sql.Request();
    updateTestsCompletedRequest.input('email', sql.NVarChar, email);
    await updateTestsCompletedRequest.query('UPDATE Users SET practiceTestsCompleted = ISNULL(practiceTestsCompleted, 0) + 1 WHERE Email = @email');
    res.json({ success: true });
  } catch (error) {
    console.error('Error incrementing practice tests completed:', error);
    res.status(500).json({ error: 'Error incrementing practice tests completed' });
  }
});

app.post('/api/checkUsername', async (req, res) => {
  console.log('checkUsername endpoint hit');
  console.log('Request body:', req.body);
  
  if (!req.isAuthenticated()) {
    console.log('User not authenticated');
    res.status(401).json({ error: 'Not logged in' });
    return;
  }
  
  try {
    const { username } = req.body;
    
    if (!username || username.trim() === '') {
      res.json({ available: false, error: 'Username cannot be empty' });
      return;
    }

    // Check if username already exists (check Username column only)
    const checkRequest = new sql.Request();
    checkRequest.input('username', sql.NVarChar, username);
    checkRequest.input('email', sql.NVarChar, req.user.emails[0].value);
    
    const result = await checkRequest.query(`
      SELECT COUNT(*) as count 
      FROM Users 
      WHERE Username = @username AND Email != @email
    `);
    
    const isTaken = result.recordset[0].count > 0;
    const available = !isTaken;
    
    console.log(`Username "${username}" availability: ${available}`);
    res.json({ available: available });
    
  } catch (error) {
    console.error('Error checking username availability:', error);
    res.status(500).json({ error: 'Error checking username availability', details: error.message });
  }
});

app.post('/api/setUsername', async (req, res) => {
  console.log('setUsername endpoint hit');
  console.log('Request body:', req.body);
  console.log('Is authenticated:', req.isAuthenticated());
  
  if (!req.isAuthenticated()) {
    console.log('User not authenticated');
    res.status(401).json({ error: 'Not logged in' });
    return;
  }
  
  try {
    const email = req.user.emails[0].value;
    const { username } = req.body;

    // Set the custom username (availability already checked by client)
    const updateRequest = new sql.Request();
    updateRequest.input('email', sql.NVarChar, email);
    updateRequest.input('username', sql.NVarChar, username);
    
    await updateRequest.query(`
      UPDATE Users 
      SET Username = @username, account_setup_complete = 1 
      WHERE Email = @email
    `);
    
    // Update the session to mark setup as complete
    req.user.needsSetup = false;
    
    console.log(`Set custom username "${username}" for email: ${email}`);
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error setting username:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Error setting username', details: error.message });
  }
});

app.post('/api/updateBestWpm', async (req, res) => {
  console.log('updateBestWpm endpoint hit');
  console.log('Request body:', req.body);
  console.log('Is authenticated:', req.isAuthenticated());
  
  if (!req.isAuthenticated()) {
    console.log('User not authenticated');
    res.status(401).json({ error: 'Not logged in' });
    return;
  }
  
  try {
    const email = req.user.emails[0].value;
    const {mode, wordCount, wpm} = req.body;
    
    console.log('Updating best WPM:', mode, wordCount, wpm, 'for email:', email);

    let columnName;
    if (mode === 'practice') {
      if (wordCount === 5) {
        columnName = '5_words_wpm';
      } else if (wordCount === 10) {
        columnName = '10_words_wpm';
      } else if (wordCount === 25) {
        columnName = '25_words_wpm';
      } else if (wordCount === 50) {
        columnName = '50_words_wpm';
      }
    } else if (mode === 'pvp') {
      columnName = 'pvp_best_wpm';
    }

    console.log('Column name determined:', columnName);

    const updateBestWpmRequest = new sql.Request();
    updateBestWpmRequest.input('email', sql.NVarChar, email);
    updateBestWpmRequest.input('wpm', sql.Int, req.body.wpm);
    updateBestWpmRequest.input('wordCount', sql.Int, req.body.wordCount);

    console.log('About to run SQL query for column:', columnName);
    console.log('SQL query:', `UPDATE Users SET [${columnName}] = CASE WHEN ISNULL([${columnName}], 0) < @wpm THEN @wpm ELSE [${columnName}] END WHERE Email = @email`);
    
    const result = await updateBestWpmRequest.query(`UPDATE Users SET [${columnName}] = CASE WHEN ISNULL([${columnName}], 0) < @wpm THEN @wpm ELSE [${columnName}] END WHERE Email = @email`);
    
    console.log('SQL query completed successfully');
    console.log('Rows affected:', result.rowsAffected);
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error updating best WPM:', error);
    console.error('Error details:', error.message);
    console.error('Full error object:', error);
    res.status(500).json({ error: 'Error updating best WPM', details: error.message });
  }
});

// Serve static files from public directory (moved after routes to prevent bypassing route handlers)
app.use(express.static(path.join(__dirname, 'public')));

let playerQueue = [];
let users = {};
let matches = {}; // Track active matches and their rooms
let privateRooms = {}; // NOTE: room.players is now an array of {username, socketId} objects.

// Function to broadcast queue count to all connected clients
function broadcastQueueCount() {
    const queueCount = playerQueue.length;
    io.emit('queueCountUpdate', { count: queueCount });
}

// Periodically broadcast queue count every 3 seconds
setInterval(() => {
    broadcastQueueCount();
}, 3000);



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
    console.log(`${userData.username || userData.displayName} connected`);
    
    // No need to check queue status on connection anymore
    // Let the queueMatch handler deal with duplicates
  });





  // Handle queue requests
  socket.on('queueMatch', () => {
    const username = socket.user ? (socket.user.username || socket.user.displayName) : socket.id;
    
    // Check if player is already in queue by username
    const isAlreadyInQueue = playerQueue.some(socketId => {
      const queuedUser = users[socketId];
      return queuedUser && (queuedUser.username || queuedUser.displayName) === username;
    });
    
    if (isAlreadyInQueue) {
      console.log(`${username} is already in queue`);
      socket.emit('queueRejected');
      return;
    }
    
    console.log(`${username} joined the queue`);
    playerQueue.push(socket.id);
    socket.emit('queueJoined');
    broadcastQueueCount();
    

    // Check if we have enough players for a match
    if (playerQueue.length >= 2) {
      console.log('Match found!');
      const player1 = playerQueue.shift();
      const player2 = playerQueue.shift();
      broadcastQueueCount();
      
      const player1Name = users[player1] ? (users[player1].username || users[player1].displayName) : player1;
      const player2Name = users[player2] ? (users[player2].username || users[player2].displayName) : player2;
      
      // Create a unique room for this match
      const roomId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Generate 50 random words for this PvP match.
      const matchWords = getRandomWords(50);
      
      // Store match information
      matches[roomId] = {
        player1: player1,
        player2: player2,
        words: matchWords,
        createdAt: new Date(),
        winnerDeclared: false
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
    const username = socket.user ? (socket.user.username || socket.user.displayName) : socket.id;
    
    console.log(`${username} left the queue`);
    playerQueue = playerQueue.filter((id) => id !== socket.id);
    broadcastQueueCount();
  });

  // Handle a player finishing the race
  socket.on('playerFinished', async () => {
    console.log(`playerFinished received from ${socket.user?.username || socket.user?.displayName}`);
    const roomId = socket.roomId;
    if (!roomId || !matches[roomId]) {
        console.log('No room ID or match found:', roomId, !!matches[roomId]);
        return;
    }

    const match = matches[roomId];

    // --- Winner Stat Update Logic ---
    if (!match.winnerDeclared) {
        console.log('Declaring winner and updating pvp_wins for:', socket.user.username || socket.user.displayName);
        match.winnerDeclared = true; // Set the lock.
        try {
            const email = socket.user.emails[0].value;
            console.log('Updating database for email:', email);
            const updateRequest = new sql.Request();
            updateRequest.input('email', sql.NVarChar, email);
            const result = await updateRequest.query(`
                UPDATE Users 
                SET pvp_wins = ISNULL(pvp_wins, 0) + 1 
                WHERE Email = @email
            `);
            console.log(`Successfully incremented pvp_wins for ${socket.user.username || socket.user.displayName}. Rows affected:`, result.rowsAffected);
        } catch (error) {
            console.error('Error updating pvp_wins:', error);
        }
    } else {
        console.log('Winner already declared for this match');
    }
    // --- End of Stat Update Logic ---

    const winnerId = socket.id;
    
    // Determine the loser's ID
    const loserId = (winnerId === match.player1) ? match.player2 : match.player1;

    // Get winner's name
            const winnerName = users[winnerId] ? (users[winnerId].username || users[winnerId].displayName) : 'Winner';

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
    const username = socket.user.username || socket.user.displayName;
   
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
    const username = socket.user ? (socket.user.username || socket.user.displayName) : socket.id;
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
        creator: socket.user.username || socket.user.displayName,
        createdAt: new Date(),
        players: [] // Empty players list - creator will be added when the new page loads
      };
      
      // Don't join the creator to the room here - they'll join when the new page loads
      socket.emit('privateRoomCreated', privateRoomId);
  });


  socket.on('checkOwnership', (data) => {
    const privateRoomId= data.privateRoomId;
    if (privateRoomId && socket.user) {
      const isOwner = privateRooms[privateRoomId].creator === (socket.user.username || socket.user.displayName);
      socket.emit('ownershipResult', { isOwner: isOwner });
    }
  });
  socket.on('invitePlayer', (data) => {
    for (user in users){
      if ((users[user].username || users[user].displayName) === data.invitee){
        io.to(user).emit('inviteReceived', {
          inviter: data.inviter, 
          privateRoomId: data.privateRoomId
        });
      }
    }
  });

  socket.on('acceptInvite', (data) => {
    console.log('acceptInvite received from:', socket.user?.username || socket.user?.displayName, 'for room:', data.privateRoomId);
    const privateRoomId = data.privateRoomId;
    const roomInfo = privateRooms[privateRoomId];

    // The ONLY responsibility of this event is to tell the client to navigate to the new page.
    // The client will then emit 'getRoomPlayers' upon loading the new page,
    // which is the single, reliable source of truth for adding a player.
    if (roomInfo && socket.user) {
      console.log('Sending redirectToRoom event to:', socket.user.username || socket.user.displayName);
      socket.emit('redirectToRoom', privateRoomId);
    } else {
      console.log('Room not found or user not authenticated. Room exists:', !!roomInfo, 'User exists:', !!socket.user);
    }
  });

  socket.on('getRoomPlayers', (privateRoomId) => {
    const room = privateRooms[privateRoomId];
    
    if (!room) {
        console.log(`User ${socket.id} tried to join non-existent room: ${privateRoomId}`);
        return;
    }

    if (room && socket.user) {
        socket.join(privateRoomId);
        socket.roomId = privateRoomId;

        const username = socket.user.username || socket.user.displayName;
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

  socket.on('leavePrivateRoom', () => {
    // The socket object itself provides all the context we need.
    // The roomId is attached to the socket when they join.
    handlePlayerLeavingPrivateRoom(socket, socket.roomId);
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
