function menu(){
    const menu = document.getElementById('menu');
    const menuContent = document.getElementById('menu-content');
    const practiceContainer = document.getElementById('practice-container');
    const keyboard = document.getElementById('keyboard');
    const wordSettings = document.getElementById('word-settings');
    const app = document.getElementById('app');
    const match = document.getElementById('match');
    const resultsScreen = document.getElementById('results-screen');
    const pvpButton = document.getElementById('pvp');
    const practiceButton = document.getElementById('practice');
    const privateMatchButton = document.getElementById('privateMatch')
    const profile = document.getElementById('profile');
    
    // All these elements should exist on index.html - if they don't, something's wrong
    if (menu) menu.style.display = 'block';
    if (menuContent) {
        menuContent.style.display = 'flex';
        menuContent.style.opacity = '1';
        menuContent.style.transform = 'scale(1)';
    }
    if (pvpButton) pvpButton.style.display = 'block';
    if (practiceButton) practiceButton.style.display = 'block';
    if (privateMatchButton) privateMatchButton.style.display = 'block';
    if (app) app.style.display = 'none';
    if (match) match.style.display = 'none';
    if (wordSettings) wordSettings.style.display = 'none';
    if (practiceContainer) practiceContainer.style.display = 'none';
    if (keyboard) keyboard.style.display = 'none';
    if (resultsScreen) resultsScreen.style.display = 'none';
}

// Function to get random words for practice mode only
function getPracticeWords(count) {
    const selectedWords = [];
    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * words.length);
        selectedWords.push(words[randomIndex]);
    }
    return selectedWords;
}

// Global variables
let keysPressed = 0;
let userTyped = '';
let typingTime = 0;
let typingSpeed = null;
let accuracy = null;
let startTime = null;
let timerInterval = null;
let isTyping = false;
let correctWords = 0;
let correctChars = 0;
let totalChars = 0;
let testComplete = false; // Flag to track if the test is complete
let pvpRaceComplete = false; // Flag to track if the PvP race is complete
let currentWordCount = 25;
let privateMatchProgressInterval = null; // Timer for sending progress updates

// Global container references
const practiceContainer = document.getElementById('practice-container');
const pvpPlayerContainer = document.getElementById('pvp-player-container');
const pvpOpponentContainer = document.getElementById('pvp-opponent-container');
const privatePlayerContainer = document.getElementById('private-player-container');

function showProfilePopup() {
    const profilePopupOverlay = document.getElementById('profilePopupOverlay');
    profilePopupOverlay.style.display = 'flex';
    
    // Trigger animation after display is set
    setTimeout(() => {
        profilePopupOverlay.classList.add('show');
    }, 10);

    fetch('/api/profileDashboard')
        .then(response => response.json())
        .then(data => {
            const playerUsername = document.getElementById('playerUsername');
            const creationDate = document.getElementById('creationDate');
            const playerProfilePicture = document.getElementById('playerProfilePicture');
            const aboutMe = document.getElementById('aboutMe');

            const totalTypingTime = document.getElementById('totalTypingTime');

            playerUsername.textContent = data.username;
            creationDate.textContent = `JOINED ${new Date(data.creationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`.toUpperCase();
            // Use the proxy route for the profile picture to avoid CORS issues
            const profileImg = document.createElement('img');
            profileImg.src = `/proxy-image?url=${encodeURIComponent(data.profilePicture)}`;
            profileImg.alt = 'Profile Picture';
            profileImg.onerror = function() {
                // Fallback: try loading the original URL directly if proxy fails
                this.src = data.profilePicture;
                this.onerror = function() {
                    // If both fail, hide the image container or show a placeholder
                    console.warn('Failed to load profile picture');
                    this.style.display = 'none';
                };
            };
            playerProfilePicture.innerHTML = '';
            playerProfilePicture.appendChild(profileImg);
            aboutMe.textContent = `About me`;
            
            // Format and display total typing time
            function formatTime(totalSeconds) {
                let hours = Math.floor(totalSeconds / 3600);
                let minutes = Math.floor((totalSeconds % 3600) / 60);
                let seconds = totalSeconds % 60;
                
                // Add leading zeros
                hours = hours.toString().padStart(2, '0');
                minutes = minutes.toString().padStart(2, '0');
                seconds = seconds.toString().padStart(2, '0');
                
                return `${hours}:${minutes}:${seconds}`;
            }
            
            totalTypingTime.textContent = `Total Typing Time: ${formatTime(data.totalTypingTime || 0)}`;
        })
        .catch(error => {
            console.error('Error loading profile data:', error);
        });
}

function hideProfilePopup() {
    const profilePopupOverlay = document.getElementById('profilePopupOverlay');
    profilePopupOverlay.classList.remove('show');
    
    // Hide after animation completes
    setTimeout(() => {
        profilePopupOverlay.style.display = 'none';
    }, 300);
}

profile.addEventListener('click', () => {
    showProfilePopup();
});

// Profile close button
const profileCloseBtn = document.getElementById('profileCloseBtn');
if (profileCloseBtn) {
    profileCloseBtn.addEventListener('click', () => {
        hideProfilePopup();
    });
}

// View full profile button
const viewFullProfileBtn = document.getElementById('viewFullProfileBtn');
if (viewFullProfileBtn) {
    viewFullProfileBtn.addEventListener('click', () => {
        window.location.href = 'fullProfile.html';
    });
}

// Close popup when clicking outside
const profilePopupOverlay = document.getElementById('profilePopupOverlay');
if (profilePopupOverlay) {
    profilePopupOverlay.addEventListener('click', (e) => {
        if (e.target === profilePopupOverlay) {
            hideProfilePopup();
        }
    });
}

// Function to display words in the typing container
function displayRandomWords(words) {
    const randomWords = words;
    
    // Generate HTML for the words
    let i = 0;
    let wrappedText2 = '';
    randomWords.forEach(function(word, index) {
        wrappedText2 += `<div class="word">`;
        word.split('').forEach(function(char, charIndex) {
            if (i === 0) wrappedText2 += '<span class="cursor"></span>';
            wrappedText2 += `<span id="char-${i}" class="char">${char}</span>`;
            i++;
        });
        if (index < randomWords.length - 1) {
            wrappedText2 += `<span id="char-${i}" class="char space">&nbsp;</span>`;
            i++;
        } else {
            wrappedText2 += `<span id="char-${i}" class="char"></span>`;
            i++;
        }
        wrappedText2 += `</div>`;
    });
    
    // Get the active container and display words
    const activeContainer = getActiveTypingContainer();
    activeContainer.innerHTML = wrappedText2;
    
    console.log('Total characters:', i);
    totalChars = i;
}

// function that resets all variables for a new typing session
function resetTypingVariables() {
    // Reset variables
    keysPressed = 0;
    userTyped = '';
    typingTime = 0;
    startTime = null;
    isTyping = false;
    correctChars = 0;
    correctWords = 0;
    totalChars = 0;
    testComplete = false; // Reset the test complete flag
    pvpRaceComplete = false; // Reset the PvP race complete flag
    
    // Clear any existing progress interval
    if (privateMatchProgressInterval) {
        clearInterval(privateMatchProgressInterval);
        privateMatchProgressInterval = null;
    }
}

// Function to start sending progress updates every second for private matches
function startPrivateMatchProgressTimer() {
    // Only start if we're in a private match and don't already have a timer
    const privateMatch = document.getElementById('privateMatch');
    if (!privateMatch || !privateMatch.classList.contains('active') || privateMatchProgressInterval) {
        return;
    }
    
    privateMatchProgressInterval = setInterval(() => {
        const activeContainer = getActiveTypingContainer();
        // Only send if we're in private match mode and match has started
        if (privatePlayerContainer && activeContainer === privatePlayerContainer && startTime) {
            socket.emit('privateMatchProgress', {
                progress: correctChars,
                totalChars: keysPressed,
                finished: false
            });
        }
    }, 1000); // Send every second
}

// end of test function (Practice Mode Only)
function endTest(){
    const endTime = new Date();

    typingTime = endTime - startTime;
    typingSpeed = Math.floor((correctWords / typingTime) * 60000);
    console.log('Correct chars:', correctChars);
    console.log('Total chars:', totalChars);

    accuracy = Math.floor((correctChars / (totalChars - 1)) * 100);
    accuracy = Math.min(accuracy, 100); // Cap accuracy at 100%     
    
    // Reset all keyboard key colors
    document.querySelectorAll('.key').forEach(key => {
        key.style.backgroundColor = '#ecdeaa';
    });
    
    console.log("Practice test ended successfully!");
    
    // Set the test complete flag to prevent further key presses
    testComplete = true;
    
    // Stop typing time tracking
    stopTypingTimeTracking();
    
    // Clear progress timer if running
    if (privateMatchProgressInterval) {
        clearInterval(privateMatchProgressInterval);
        privateMatchProgressInterval = null;
    }

    // Show practice results overlay
    showPracticeResultsOverlay();

    fetch('api/incrementPracticeTestsCompleted', {
        method: 'POST'
        // No headers or body are needed. The server knows who the user is
        // from their session cookie.
    })
    .then(response => {
        if (!response.ok) {
            console.error('Failed to increment practice tests completed');
        }
    })
    .catch(error => {
        console.error('Error incrementing practice tests completed:', error);
    });
}

function showPracticeResultsOverlay() {
    // Update practice results in the overlay
    const wpmElement = document.getElementById('practice-wpm');
    const accuracyElement = document.getElementById('practice-accuracy');
    const practiceResults = document.getElementById('practice-results');
    
    if (wpmElement) wpmElement.textContent = typingSpeed;
    if (accuracyElement) accuracyElement.textContent = accuracy + '%';
    
    // Show practice results overlay (only if element exists)
    if (practiceResults) {
        practiceResults.style.display = 'flex';
    }
}

//Prac Mode Only
function restartTest() {
    const practiceResults = document.getElementById('practice-results');
    const practiceContainer = document.getElementById('practice-container');
    const keyboard = document.getElementById('keyboard');
    
    practiceResults.style.display = 'none';
    practiceContainer.style.display = 'block';
    keyboard.style.display = 'block';
    
    // Scroll back to top
    practiceContainer.scrollTop = 0;
    
    resetTypingVariables();
    displayRandomWords(getPracticeWords(currentWordCount));
}

// PvP-specific end race function
function handlePlayerFinish() {
    calculateStats();

    // Set the PvP race complete flag to prevent further key presses
    pvpRaceComplete = true;
    
    // Notify the server that this player has finished.
    // The server will then broadcast the 'raceOver' event to all players.
    socket.emit('playerFinished');
} 

function calculateStats(){
    const endTime = new Date();
    const privateMatch = document.getElementById('privateMatch');
    const isPrivateMode = privateMatch && privateMatch.classList.contains('active');
    
    // For private matches, use the shared match timer. For other modes, use personal start/end time.
    if (isPrivateMode) {
        // This code only runs on privatematch.html, where the function is guaranteed to exist.
        typingTime = getMatchElapsedTime();
    } else {
        typingTime = endTime - startTime;
    }
    
    // Fallback if typingTime is somehow 0 to prevent division by zero
    if (!typingTime || typingTime <= 0) {
        typingTime = endTime - startTime;
    }

    typingSpeed = Math.floor((correctWords / typingTime) * 60000);
    accuracy = Math.floor((correctChars / keysPressed) * 100);
    accuracy = Math.min(accuracy, 100); // Cap accuracy at 100%

    // Update the typing speed and accuracy in the PvP results overlay (only if elements exist)
    const typingSpeedElement = document.getElementById('typingSpeed');
    const accuracyElement = document.getElementById('accuracy');
    
    if (typingSpeedElement) {
        typingSpeedElement.textContent = `Words Per Minute: ${typingSpeed}`;
    }
    if (accuracyElement) {
        accuracyElement.textContent = `Accuracy: ${accuracy}%`;
    }

}

function updatePlayerList(players, playerCount) {
    const playerListDiv = document.getElementById('playerList');
    const playersHeader = document.querySelector('.players-header');

    if (!playerListDiv || !playersHeader) return;

    // --- Smart Update Logic ---
    const existingPlayerUsernames = new Set(
        Array.from(playerListDiv.querySelectorAll('.player-item')).map(div => div.dataset.username)
    );
    const newPlayerUsernames = new Set(players);

    // 1. Remove players who are no longer in the list
    existingPlayerUsernames.forEach(username => {
        if (!newPlayerUsernames.has(username)) {
            const playerToRemove = playerListDiv.querySelector(`[data-username="${username}"]`);
            if (playerToRemove) {
                playerToRemove.remove();
            }
        }
    });

    // 2. Add new players who are not already in the list
    newPlayerUsernames.forEach(username => {
        if (!existingPlayerUsernames.has(username)) {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-item newly-added'; // Add the animation class
            playerDiv.textContent = username;
            playerDiv.dataset.username = username; // Store username for tracking
            playerListDiv.appendChild(playerDiv);

            // Remove the class after the animation completes to prevent re-animating
            setTimeout(() => {
                playerDiv.classList.remove('newly-added');
            }, 500); // Must match the animation duration in CSS
        }
    });
    
    // 3. Update the header count
    playersHeader.textContent = `PLAYERS (${playerCount})`;
}


function showDisconnectOverlay() {
    const oppDisconnectScreen = document.getElementById('oppDisconnectScreen');
    oppDisconnectScreen.style.display = 'block';
}

function showPvPResultsOverlay() {
    const pvpResults = document.getElementById('pvp-results');
    pvpResults.style.display = 'flex';
}

function hideAllOverlays() {
    const overlays = document.querySelectorAll('.match-overlay');
    overlays.forEach(overlay => {
        overlay.style.display = 'none';
    });
}

function showCountdown(callback) {
    const countdownComponent = document.querySelector('countdown-component');
    countdownComponent.start(callback);
}




function finishAnimation(isWinner = false, opponentName = 'Opponent'){
    const finishComponent = document.getElementById('finish-animation-component');
    
    if (!finishComponent) {
        console.log('Finish animation component not found');
        return;
    }
    
    // Use the web component's show method
    finishComponent.show({
        isWinner: isWinner,
        opponentName: opponentName,
        duration: 4000
    });
}

function backToMenu() {
    const resultsScreen = document.getElementById('results-screen');
    const match = document.getElementById('match');
    const pvpmenu = document.getElementById('pvpmenu');
    
    // Hide all PvP-related elements
    resultsScreen.style.display = 'none';
    resultsScreen.style.position = '';
    resultsScreen.style.zIndex = '';
    match.style.display = 'none';
    pvpmenu.style.display = 'none';

    const queueButton = document.getElementById('queueBtn');
    if (queueButton) {
        queueButton.removeEventListener('click', queueClickHandler);
    }
    // Leave queue
    socket.emit('leaveQueue');
    

    
    // Clean up socket events to prevent conflicts
    socket.off('typingProgressReceived');
    socket.off('opponentDisconnected');
    
    // Hide all overlays and reset containers
    hideAllOverlays();
    
    // Clear typing containers
            if (pvpPlayerContainer) pvpPlayerContainer.innerHTML = '';
        if (pvpOpponentContainer) pvpOpponentContainer.innerHTML = '';
    

    
    // Reset test state
    testComplete = false;
    pvpRaceComplete = false;
    
    menu(); // Go back to main menu
}

// Initialize Socket.IO connection
const socket = io();

// Function to setup PvP-specific socket event listeners
function setupPvPSocketEvents() {

    socket.on('raceOver', (data) => {
        // This event is now received by both the winner and the loser at the same time.
        pvpRaceComplete = true; // Stop typing for both players
        calculateStats();
        
        // Stop typing time tracking
        stopTypingTimeTracking();
        
        // Reset all keyboard key colors
        document.querySelectorAll('.key').forEach(key => {
            key.style.backgroundColor = '#ecdeaa';
        });
        
        // Check if the current client is the winner
        if (socket.id === data.winnerId) {
            finishAnimation(true); // Show "You Win!" animation
        } else {
            // Otherwise, they are the loser, show the opponent's name
            finishAnimation(false, data.winnerName); 
        }

        // Show the results overlay for both players after the animation
        setTimeout(() => {
            showPvPResultsOverlay();
        }, 4000);
    });
 
    // Handle received words from opponent
    socket.on('typingProgressReceived', (data) => {
        // Only process if we're actually in a PvP match
        const match = document.getElementById('match');
        if (!match || match.style.display === 'none') {
            return;
        }
        
        if (pvpOpponentContainer) {
            pvpOpponentContainer.innerHTML = data.htmlContent;
            const oppCursor = pvpOpponentContainer.querySelector('.cursor');
            
            if (oppCursor) {
                const containerRect = pvpOpponentContainer.getBoundingClientRect();
                const cursorRect = oppCursor.getBoundingClientRect();
                // Calculate desired offset (1/3 from the top)
                const desiredOffset = containerRect.height / 3;
                const cursorOffset = cursorRect.top - containerRect.top;
                const newScrollTop = pvpOpponentContainer.scrollTop + cursorOffset - desiredOffset;
                pvpOpponentContainer.scrollTop = newScrollTop;
            }
        }

        // Update opponent's progress counter
        console.log('Received opponent data:', data);
        const opponentProgressElement = document.getElementById('opponent-progress');
        console.log('Opponent progress element:', opponentProgressElement);
        
        if (data.correctWords !== undefined) {
            if (opponentProgressElement) {
                opponentProgressElement.textContent = `${data.correctWords}/50`;
                console.log('Updated opponent progress to:', data.correctWords);
            } else {
                console.log('Opponent progress element not found');
            }
        } else {
            console.log('No correctWords in opponent data');
            // Set to 0/50 as fallback
            if (opponentProgressElement) {
                opponentProgressElement.textContent = '0/50';
            }
        }
        
        // Color opponent's keyboard based on their key press
        if (data.keyPressed) {
            const keyId = data.keyPressed === ' ' ? 'space' : data.keyPressed.toUpperCase();
            const oppKey = document.querySelector(`#opp-keyboard #${keyId}`);
            
            if (oppKey) {
                // Set color based on correctness
                const color = data.keyCorrect ? 'green' : 'red';
                oppKey.style.backgroundColor = color;
                
                // Reset color after delay
                setTimeout(() => {
                    oppKey.style.backgroundColor = '#ecdeaa';
                }, 100);
            }
        }
    });

    socket.on('opponentDisconnected', () => {
        console.log('Opponent disconnected');
        
        // Only process if we're actually in a PvP match
        const match = document.getElementById('match');
        if (!match || match.style.display === 'none') {
            return;
        }
        
        hideAllOverlays();
        // Show disconnect overlay
        showDisconnectOverlay();
        
        // Stop the PvP race
        pvpRaceComplete = true;
    });
}

socket.on('queueJoined', () => {
    console.log('Successfully joined the queue');
    const queueBtn = document.getElementById('queueBtn');
    if (queueBtn) {
        queueBtn.textContent = 'Leave Queue';
    }
});

socket.on('matchFound', (data) => {
    console.log('Match found!');
    console.log('Your opponent is:', data.opponent);
    console.log('Room ID:', data.roomId);
    const queueMenu = document.getElementById('queueMenu');
    const animationOverlay = document.getElementById('queue-animation-overlay');
    const match = document.getElementById('match');

    const oppLabel = document.querySelector('#oppTypingArea .typing-area-label');
    
    // Setup socket events for this match
    setupPvPSocketEvents();
    
    if (match) {
        // Hide the queue menu and show the match container
        if (animationOverlay) animationOverlay.classList.remove('active');
        queueMenu.style.display = 'none';
        const queueBackBtn = document.getElementById('queueBackBtn');
        if (queueBackBtn) queueBackBtn.classList.remove('active');
        match.style.display = 'block';
        
        // Update opponent label with their name
        if (oppLabel) {
            oppLabel.innerHTML = `${data.opponent} <span id="opponent-progress">0/50</span>`;
        }
        
        // Hide practice mode elements
        const practiceKeyboard = document.getElementById('keyboard');
        if (practiceKeyboard) {
            practiceKeyboard.style.display = 'none';
        }
        
        // Show PvP keyboards
        const playerKeyboard = document.getElementById('player-keyboard');
        const oppKeyboard = document.getElementById('opp-keyboard');
        if (playerKeyboard) {
            playerKeyboard.style.display = 'block';
        }
        if (oppKeyboard) {
            oppKeyboard.style.display = 'block';
        }
        
        // Show countdown before starting the game
        showCountdown(() => {
                    // Initialize the player's typing session after countdown
        resetTypingVariables();
        displayRandomWords(data.words);
        trackTimeTyped();

        // Send initial words to opponent (without key data)
        if (pvpPlayerContainer) {
            socket.emit('typingProgress', {
                htmlContent: pvpPlayerContainer.innerHTML
            });
        }

        });
    }
});

// Move these to be available for the event listeners above
const pvpButton = document.getElementById('pvp');
const privateMatchButton = document.getElementById('privateMatch');
const queueMenu = document.getElementById('queueMenu');
const menuContent = document.getElementById('menu-content');
const animationOverlay = document.getElementById('queue-animation-overlay');

function createGrid() {
    if (!animationOverlay) return;
    animationOverlay.innerHTML = '';
    const numCells = 20 * 10; // 20 columns, 10 rows
    for (let i = 0; i < numCells; i++) {
        const cell = document.createElement('div');
        cell.classList.add('grid-cell');
        animationOverlay.appendChild(cell);
    }
}

const queueClickHandler = function() {
    if (this.textContent !== "Finding Match..." && this.textContent !== "Leave Queue"){
        this.textContent = 'Finding Match...';
        this.classList.add('finding-match'); // Add button animation class
        
        // --- Trigger Grid Animation ---
        if (animationOverlay) {
            animationOverlay.classList.remove('active'); // Reset animation
            // Stagger the animation of each cell to create a wave effect
            const cells = animationOverlay.children;
            for (let i = 0; i < cells.length; i++) {
                const row = Math.floor(i / 20);
                const col = i % 20;
                cells[i].style.animationDelay = `${(row + col) * 0.04}s`;
            }
            void animationOverlay.offsetWidth; // Force reflow to restart animation
            animationOverlay.classList.add('active');
        }
        
        socket.emit('queueMatch');
    }

    else{
        this.textContent = 'Find Match';
        this.classList.remove('finding-match'); // Remove button animation class

        if (animationOverlay) {
            animationOverlay.classList.remove('active');
            
            // Ensure all cells have no animation delay for the leaving animation
            const cells = animationOverlay.children;
            for (let i = 0; i < cells.length; i++) {
                cells[i].style.animationDelay = '0s';
            }

            animationOverlay.classList.add('leaving');
            // Remove the 'leaving' class after the animation completes
            setTimeout(() => {
                animationOverlay.classList.remove('leaving');
            }, 1000); // Must match animation duration
        }
        
        socket.emit('leaveQueue');
    }
}

if (pvpButton) {
pvpButton.addEventListener('click', function() {
    const menu = document.getElementById('menu');
    const profileDiv = document.getElementById('profile');
    const pvpmenu = document.getElementById('pvpmenu');
    const queueBackBtn = document.getElementById('queueBackBtn');

    // Hide profile when entering PvP mode
    if (profileDiv) {
        profileDiv.style.display = 'none';
    }

    menuContent.style.opacity = '0';
    menuContent.style.transform = 'scale(0.8)';
    setTimeout(() => {
        menu.style.display = 'none';
        menuContent.style.display = 'none';
        pvpmenu.style.display = 'block';
        if (queueBackBtn) queueBackBtn.classList.add('active');
    }, 300);
});
}

// Update back button handler for PvP menu
const queueBackBtn = document.getElementById('queueBackBtn');
if (queueBackBtn) {
    queueBackBtn.addEventListener('click', function() {
        const pvpmenu = document.getElementById('pvpmenu');
        const profileDiv = document.getElementById('profile');
        const queueBtn = document.getElementById('queueBtn');
        
        // Leave queue if we're in queue
        if (queueBtn && (queueBtn.textContent === 'Leave Queue' || queueBtn.textContent === 'Finding Match...')) {
            socket.emit('leaveQueue');
            queueBtn.textContent = 'Find Match';
            queueBtn.classList.remove('finding-match');
        }
        
        pvpmenu.style.display = 'none';
        if(queueBackBtn) queueBackBtn.classList.remove('active');
        if (profileDiv) {
            profileDiv.style.display = 'flex';
        }
        menu();
    });
}

// Update queue button handler
const queueBtn = document.getElementById('queueBtn');
if (queueBtn) {
    queueBtn.addEventListener('click', queueClickHandler);
}

const animationContainer = document.getElementById('animationContainer');

// Only attach event listener if it's actually a button (on index.html, not privatematch.html)
if (privateMatchButton && privateMatchButton.tagName === 'BUTTON') {
privateMatchButton.addEventListener('click', function() {
    console.log('Private match button clicked!');
    socket.emit('createPrivateRoom');
});
}

socket.on('privateRoomCreated', (privateRoomId) => {
    window.location.href = `/privatematch.html?room=${privateRoomId}`;
});

// Add handler for when queue is rejected due to already being in queue
socket.on('queueRejected', () => {
    console.log('Queue rejected - already in queue from another window');
    
    // Reset button to normal state
    const queueButton = document.getElementById('queueBtn');
    if (queueButton) {
        queueButton.textContent = 'Find Match';
        queueButton.classList.remove('finding-match');
        
        // Hide animation overlay if it's active
        const animationOverlay = document.getElementById('queue-animation-overlay');
        if (animationOverlay) {
            animationOverlay.classList.remove('active');
        }
    }
    
    // Show user feedback
    alert('You are already in queue from another tab/window');
});

let typingStarted = null;
let lastKeystroke = null;
let timeTyped = 0;

function trackTimeTyped() {
    typingStarted = new Date();
    lastKeystroke = new Date();
    timeTyped = 0;
    isTyping = true;

}

function stopTypingTimeTracking() {
    isTyping = false;

    updateTypingTime(timeTyped);
}

function updateTypingTime(timeTyped) {
    fetch('/api/updateTypingTime', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ timeTyped: timeTyped })
    });
}

// Event listener for typing and backspace handling
document.addEventListener('keydown', function(event) {

    // Allow space key to work in input fields
    if (event.key === ' ' && event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
        event.preventDefault(); // Prevent space bar from scrolling
    }
    
    if (testComplete || pvpRaceComplete || window.countdownActive) {
        event.preventDefault();
        return;
    }
    
    const activeContainer = getActiveTypingContainer();
    if (!activeContainer || activeContainer.style.display === 'none') {
        return; // Don't process keys if not in typing mode
    }
    
    // If the test is complete, don't process any key presses
    if (!startTime) {
        startTime = new Date();
    }
    
    if (event.key.length === 1) {
        userTyped += event.key;
    }
    else if (event.key === 'Backspace') {
        userTyped = userTyped.slice(0, -1);
    }
    else if (event.key === ' ') {
        userTyped += ' ';
    }
    
    isTyping = true;

    // Track typing time (after isTyping is set to true)
    let keystroke = new Date();
    if (lastKeystroke && (keystroke - lastKeystroke) < 1000) {
        timeTyped += (keystroke - lastKeystroke) / 1000;
    }
    lastKeystroke = keystroke;

    if (event.key === 'Backspace') {
        if (keysPressed > 0) {
            keysPressed--;
            const prevSpan = activeContainer.querySelector(`#char-${keysPressed}`);
            if (prevSpan) {
                prevSpan.classList.remove("matched", "unmatched");
                const cursor = activeContainer.querySelector('.cursor');
                if (cursor && prevSpan.parentNode) {
                    prevSpan.parentNode.insertBefore(cursor, prevSpan);
                }
            }
        }
        return;
    }
    
    const currentSpan = activeContainer.querySelector(`#char-${keysPressed}`);
    if (!currentSpan) return;
    
    let currentLetter = currentSpan.textContent;
    if (currentLetter.charCodeAt(0) === 160) { // 160 is the char code for &nbsp;
        currentLetter = ' ';
    }
    
    // Debug logging for spaces
    if (event.key === ' ' || currentLetter === ' ') {
        console.log('Space detected:', {
            eventKey: `"${event.key}"`,
            currentLetter: `"${currentLetter}"`,
            eventKeyLength: event.key.length,
            currentLetterLength: currentLetter.length,
            isMatch: event.key === currentLetter
        });
    }
    
    if (event.key === currentLetter) {
        currentSpan.classList.add("matched");
        colorKey('#4CAF50', event.key);
        correctChars++; // Increment correctChars for accurate typing
    } else {
        currentSpan.classList.add("unmatched");
        colorKey('#F44336', event.key);
    }

    keysPressed++;
    
    const nextSpan = activeContainer.querySelector(`#char-${keysPressed}`);
    const cursor = activeContainer.querySelector('.cursor');
    if (nextSpan && cursor && nextSpan.parentNode) {
        nextSpan.parentNode.insertBefore(cursor, nextSpan);
    }

    // Send current typing progress to opponent (only in PvP mode)
    if (pvpPlayerContainer && activeContainer === pvpPlayerContainer) {
        const wasCorrect = currentSpan.classList.contains('matched');
        
        // Update player's progress counter
        const playerProgressElement = document.getElementById('player-progress');
        if (playerProgressElement) {
            playerProgressElement.textContent = `${correctWords}/50`;
        }
        
        const progressData = {
            htmlContent: pvpPlayerContainer.innerHTML,
            keyPressed: event.key,
            keyCorrect: wasCorrect,
            correctWords: correctWords
        };
        console.log('Sending progress data:', progressData);
        socket.emit('typingProgress', progressData);
    }

    // Progress updates for private matches are now handled by the timer function
    // No need to send on every keypress since we send every second

    // Scroll handling: Keep the cursor visible and higher up (about 1/3 from the top)
    if (cursor) {
        const containerRect = activeContainer.getBoundingClientRect();
        const cursorRect = cursor.getBoundingClientRect();
        // Calculate desired offset (1/3 from the top)
        const desiredOffset = containerRect.height / 3;
        const cursorOffset = cursorRect.top - containerRect.top;
        const newScrollTop = activeContainer.scrollTop + cursorOffset - desiredOffset;
        activeContainer.scrollTop = newScrollTop;
    }

                // Check if we're in PvP mode or private match mode
    const isPvPMode = pvpPlayerContainer && activeContainer === pvpPlayerContainer;
    const isPrivateMode = privatePlayerContainer && activeContainer === privatePlayerContainer;

    // --- PvP WIN CONDITION (check first) ---
    if (isPvPMode && correctWords >= 50) {
        handlePlayerFinish();
        return; // Exit early, don't check the last word logic
    }
    // --- NEW COMPLETION LOGIC ---
    // Check if we've reached the last character (totalChars - 1 because it's 0-indexed)
    if (keysPressed === totalChars - 1) {
        const words = activeContainer.querySelectorAll('.word');
        const lastWord = words[words.length - 1];
        const lastWordChars = lastWord.querySelectorAll('.char:not(:empty)');
        let lastWordMatched = true;
        
        lastWordChars.forEach(char => {
            if (!char.classList.contains('matched')) {
                lastWordMatched = false;
            }
        });

        // Only end the match if the last word is fully correct
        if (lastWordMatched) {

            if (isPrivateMode) {
                // Stop the visual timer immediately
                const timer = document.querySelector('match-timer-component');
                if (timer) {
                    timer.stopTimer();
                }

                // Mark as complete to stop typing and the timer
                testComplete = true; 
                
                // Stop typing time tracking
                stopTypingTimeTracking();
                
                // Reset all keyboard colors
                document.querySelectorAll('.key').forEach(key => {
                    key.style.backgroundColor = '#ecdeaa';
                });

                // Calculate final stats before sending
                calculateStats();
                
                // For private matches, send the final finished signal
                socket.emit('privateMatchProgress', {
                    progress: correctChars,
                    totalChars: keysPressed,
                    finished: true,
                    finalWpm: typingSpeed, // Send final WPM
                    finalAccuracy: accuracy // Send final accuracy
                });

                // Stop the progress interval immediately
                if (privateMatchProgressInterval) {
                    clearInterval(privateMatchProgressInterval);
                    privateMatchProgressInterval = null;
                }
            } else {
                // This handles practice mode
                endTest();
            }
        }
    }
});

document.addEventListener('keyup', function(event) {
    // If the test is complete, don't process any key lifts except for color reset
    if (testComplete || pvpRaceComplete) {
        return;
    }
    
    const activeContainer = getActiveTypingContainer();
    if (!activeContainer || activeContainer.style.display === 'none') {
        return; // Don't process keys if not in typing mode
    }
    
    colorKey('#ecdeaa', event.key);

    // Check word completion and update correctWords count
    const words = activeContainer.querySelectorAll('.word');
    correctWords = 0;
    
    words.forEach(word => {
        // Only check non-space characters (exclude the space at the end of each word)
        const chars = word.querySelectorAll('.char:not(:empty):not(.space)');
        let wordMatched = true;
        
        chars.forEach(char => {
            if (!char.classList.contains('matched')) {
                wordMatched = false;
            }
        });
        
        if (wordMatched && chars.length > 0) {
            correctWords++;
        }
    });
});

// Function to manage keyboard key colors
function colorKey(color, keyId) {
    // Determine which keyboard to target based on current mode
    const activeContainer = getActiveTypingContainer();
    
    const isPvPMode = pvpPlayerContainer && activeContainer === pvpPlayerContainer;
    const isPrivateMode = privatePlayerContainer && activeContainer === privatePlayerContainer;
    

    
    // Special handling for spacebar keyboard key
    if (keyId === ' ') {
        if (isPvPMode) {
            const playerSpacebar = document.querySelector('#player-keyboard #space');
            if (playerSpacebar) {
                playerSpacebar.style.backgroundColor = color;
            }
        } else {
            const spacebarElement = document.querySelector('#keyboard #space');
            if (spacebarElement) {
                spacebarElement.style.backgroundColor = color;
            }
        }
        return;
    }
    
    // Only handle letter keys (A-Z) for keyboard
    const upperKey = keyId.toUpperCase();
    if (!/^[A-Z]$/.test(upperKey)) {
        return; // Skip special characters and numbers
    }
    
    // Handle regular keyboard keys
    if (isPvPMode) {
        const playerKey = document.querySelector(`#player-keyboard #${upperKey}`);
        if (playerKey) {
            playerKey.style.backgroundColor = color;
        }
    } else {
        const keybutton = document.querySelector(`#keyboard #${upperKey}`);
        if (keybutton) {
            keybutton.style.setProperty('background-color', color, 'important');
        }
    }
}   



// Helper function to get the active typing container
function getActiveTypingContainer() {
    // Check for private match mode first
    const privateMatch = document.getElementById('privateMatch');
    if (privateMatch && privateMatch.classList.contains('active')) {
        return document.getElementById('private-player-container');
    }
    
    // Check for PVP match mode
    const match = document.getElementById('match');
    if (match && match.style.display === 'block') {
        return document.getElementById('pvp-player-container');
    } 
    
    // Default to practice mode
        return document.getElementById('practice-container');
    }

// Store previous rankings for animation
let previousRankings = {};

function updateLeaderboard(playerStats) {
    const leaderboard = document.getElementById('players');
    
    // Safety check - only update leaderboard if element exists (privatematch.html only)
    if (!leaderboard) {
        return;
    }
    
    const playerList = Object.entries(playerStats);

    const sortedPlayers = playerList.sort((playerA, playerB) => {
        if (playerA[1].wpm === playerB[1].wpm) {
            return playerB[1].accuracy - playerA[1].accuracy;
        }

        else {
            return playerB[1].wpm - playerA[1].wpm;
        }
    });

    // Clear existing leaderboard
    leaderboard.innerHTML = '';

    sortedPlayers.forEach((player, index) => {
        const playerName = player[0];
        const currentRanking = index + 1;
        const playerWpm = player[1].wpm;
        const playerAccuracy = player[1].accuracy;
        const previousRanking = previousRankings[playerName] || currentRanking;

        const playerElement = document.createElement('div');
        playerElement.id = `${playerName}`;
        playerElement.className = 'player-entry';

        // Determine ranking change animation
        let rankingChangeClass = '';
        let rankingIndicator = '';
        
        if (previousRanking > currentRanking) {
            rankingChangeClass = 'ranking-up';
            rankingIndicator = ' ↑';
        } else if (previousRanking < currentRanking) {
            rankingChangeClass = 'ranking-down';
            rankingIndicator = ' ↓';
        }

        playerElement.innerHTML = `
            <div class="player-row ${rankingChangeClass}">
                <div class="player-name">#${currentRanking} ${playerName}${rankingIndicator}</div>
                <div class="playerStats">${playerWpm} WPM | ${playerAccuracy}%</div>
            </div>
        `;

        leaderboard.appendChild(playerElement);

        // Store current ranking for next update
        previousRankings[playerName] = currentRanking;
    });
}

// This function is the "nuclear option" used ONLY when leaving the room completely.
function cleanupPrivateMatchListeners() {
    socket.off('privateMatchStarted');
    socket.off('privateMatchEnded');
    socket.off('leaderboardUpdate');
    socket.off('playerJoined');
    socket.off('playerLeft');
    socket.off('resetToLobby');
    console.log('All private match listeners have been removed.');
}

function showFinalLeaderboard(playerStats, privateRoomId) {
    const finalLeaderboard = document.getElementById('finalLeaderboard');
    const playerRankingsContainer = document.getElementById('playerRankings');

    if (!finalLeaderboard || !playerRankingsContainer) {
        console.error('Final leaderboard elements not found!');
        return;
    }

    // Clear any previous rankings to prevent duplicates
    playerRankingsContainer.innerHTML = '';

    // Sort players by WPM (highest first), then accuracy
    const sortedPlayers = Object.entries(playerStats).sort((a, b) => {
        const wpmA = a[1].finalWpm || a[1].wpm || 0;
        const wpmB = b[1].finalWpm || b[1].wpm || 0;
        if (wpmB !== wpmA) {
            return wpmB - wpmA;
        }
        const accA = a[1].finalAccuracy || a[1].accuracy || 0;
        const accB = b[1].finalAccuracy || b[1].accuracy || 0;
        return accB - accA;
    });

    // Create and append player rank cards
    sortedPlayers.forEach((player, index) => {
        const [playerName, stats] = player;
        const rank = index + 1;
        
        const playerCard = document.createElement('div');
        playerCard.className = `player-rank-card rank-${rank <= 3 ? rank : 'other'}`;
        playerCard.style.animationDelay = `${index * 0.15}s`;

        const rankText = document.createElement('div');
        rankText.textContent = `#${rank}`;
        rankText.className = 'player-rank-number';

        const playerInfo = document.createElement('div');
        playerInfo.className = 'player-info';

        const playerNameDiv = document.createElement('div');
        playerNameDiv.textContent = playerName;
        playerNameDiv.className = 'player-name-final';

        const playerStatsDiv = document.createElement('div');
        const wpm = stats.finalWpm || stats.wpm || 0;
        const accuracy = stats.finalAccuracy || stats.accuracy || 0;
        playerStatsDiv.textContent = `${wpm} WPM | ${accuracy}% Accuracy`;
        playerStatsDiv.className = 'player-stats-final';

        playerInfo.appendChild(playerNameDiv);
        playerInfo.appendChild(playerStatsDiv);
        playerCard.appendChild(rankText);
        playerCard.appendChild(playerInfo);
        playerRankingsContainer.appendChild(playerCard);
    });

    // Make the HTML buttons visible
    const playAgainBtn = document.getElementById('playAgainBtn');
    const finalMenuBtn = document.getElementById('finalMenuBtn');
    if(playAgainBtn) playAgainBtn.style.display = 'block';
    if(finalMenuBtn) finalMenuBtn.style.display = 'block';

    // Make the full-screen overlay visible
    finalLeaderboard.style.display = 'flex';
}

// Prevent manual scrolling on typing containers
function preventManualScrolling() {
    const containers = ['practice-container', 'pvp-player-container', 'pvp-opponent-container', 'private-player-container'];
    
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            // Prevent wheel scrolling
            container.addEventListener('wheel', function(e) {
                e.preventDefault();
            }, { passive: false });
            
            // Prevent touch scrolling
            container.addEventListener('touchmove', function(e) {
                e.preventDefault();
            }, { passive: false });
        }
    });
}

// Initialize game and set up word count selection
window.onload = function() {
    // Check if the user was kicked from a private room for refreshing
    if (sessionStorage.getItem('kickedOnRefresh') === 'true') {
        alert('You have been removed from the room because you refreshed the page.');
        sessionStorage.removeItem('kickedOnRefresh'); // Clear the flag
    }

    // Only call menu() on index.html (check if menu element exists)
    if (document.getElementById('menu')) {
        menu();
    }
    
    // Create the grid for the animation on page load
    createGrid();
    
    // Prevent manual scrolling
    preventManualScrolling();

    // Practice mode button handler (only exists on index.html)
    const practiceButton = document.querySelector('#practice');
    if (practiceButton) {
        practiceButton.addEventListener('click', function() {
        const menu = document.getElementById('menu');
        const wordSettings = document.getElementById('word-settings');
        const keyboard = document.getElementById('keyboard');
        const menuContent = document.getElementById('menu-content');
        const app = document.getElementById('app');
        
        // Hide menu and show app
        menu.style.display = 'none';
        menuContent.style.display = 'none';
        app.style.display = 'block';
        wordSettings.style.display = 'block';
        practiceContainer.style.display = 'block';
        keyboard.style.display = 'block';
        
        // Hide PvP keyboards
        const playerKeyboard = document.getElementById('player-keyboard');
        const oppKeyboard = document.getElementById('opp-keyboard');
        if (playerKeyboard) playerKeyboard.style.display = 'none';
        if (oppKeyboard) oppKeyboard.style.display = 'none';
        
        // Initialize the typing session
        resetTypingVariables();
        displayRandomWords(getPracticeWords(25));
        trackTimeTyped();
    });
    }
    
    // Set up word count selection listeners after DOM is loaded (only exists on index.html)
    const wordCountElements = document.querySelectorAll('.word-count');
    if (wordCountElements.length > 0) {
        wordCountElements.forEach(element => {
        element.addEventListener('click', function() {
            currentWordCount = parseInt(this.dataset.count);
            const resultsScreen = document.getElementById('results-screen');
            const keyboard = document.getElementById('keyboard');
            // Hide the results screen and show the practice container
            practiceContainer.style.display = 'block';
            keyboard.style.display = 'block';
            resultsScreen.style.display = 'none';
            
            // Reset and start new session
            resetTypingVariables();
            displayRandomWords(getPracticeWords(currentWordCount));
        });
    });
    }
    

    
    // Send userData immediately
    fetch('/auth/status')
        .then(res => res.json())
        .then(data => {
            console.log('Auth check result:', data);
            if (data.authenticated && data.user) {
                console.log('Sending userData for:', data.user.displayName);
                socket.emit('userData', data.user);
            } else {
                console.log('Not authenticated or no user data');
            }
        })
        .catch(err => console.error('Auth status error:', err));

    const invitePopup = document.getElementById('invitePopup');

    if (invitePopup) {
        let inviteQueue = [];
        let invitePopupOpen = false;
        let inRoom = false;

        // Shows the next invite in the queue
        function showNextInvite() {
            if (inviteQueue.length === 0 || inRoom) {
                invitePopupOpen = false;
                return;
            }
            
            invitePopupOpen = true;
            const data = inviteQueue.shift();
            const popup = document.getElementById('invitePopup');
            const header = document.getElementById('invitePopupHeader');
            const acceptBtn = document.getElementById('acceptInvite');
            const rejectBtn = document.getElementById('rejectInvite');

            if (popup && header) {
                header.textContent = `${data.inviter} invited you to join their private room!`;
                popup.classList.add('show');
            } else {
                console.log('Popup or header element not found!');
            }

            if (acceptBtn) {
                acceptBtn.onclick = () => {
                    if (!popup) return;
                    inRoom = true;
                    inviteQueue = [];
                    invitePopupOpen = false;

                    popup.classList.remove('show');
                    socket.emit('acceptInvite', {privateRoomId: data.privateRoomId});
                }
            }

            if (rejectBtn) {
                rejectBtn.onclick = () => {
                    if (!popup) return;
                    invitePopupOpen = false;
                    popup.classList.remove('show');
                    showNextInvite(); 
                }
            }
        }

        socket.on('inviteReceived', (data) => {
            console.log('Received invite from:', data.inviter);
    
            const pvpMatchContainer = document.getElementById('match');
            const inPvpMatch = pvpMatchContainer && pvpMatchContainer.style.display !== 'none';
            if (inPvpMatch || inRoom) {
                return;
            }
            
            const isAlreadyInQueue = inviteQueue.some(invite => invite.inviter === data.inviter);
            if (!isAlreadyInQueue) {
                inviteQueue.push(data);
                if (!invitePopupOpen) {
                    showNextInvite();
                }
            }
        });

        window.onLeaveRoom = function() {
            inRoom = false;
        }
    }

// Handle redirect to private room after accepting invite
socket.on('redirectToRoom', (roomId) => {
    window.location.href = `/privatematch.html?room=${roomId}&redirected=true`;
            
});

socket.on('leaderboardUpdate', (data) => {
    updateLeaderboard(data.playerStats);
});
};

document.addEventListener('DOMContentLoaded', () => {
    fetch('/auth/status')
        .then(res => res.json())
        .then(data => {
            if (data.authenticated && data.user) {
                const profileDiv = document.getElementById('profile');
                const usernameDiv = document.getElementById('username');
                const profilePicDiv = document.getElementById('profile-picture');
                if (usernameDiv && data.user.displayName) {
                    usernameDiv.textContent = data.user.displayName;
                }
                // The correct property for Google OAuth picture is _json.picture
                if (data.user._json && data.user._json.picture) {
                    const picUrl = data.user._json.picture;
                    // Use the server-side proxy to avoid potential cross-origin issues
                    if (profilePicDiv) {
                        profilePicDiv.style.backgroundImage = `url('/proxy-image?url=${encodeURIComponent(picUrl)}')`;
                    }
                }
                if (profileDiv) {
                    profileDiv.style.display = 'flex'; // Show the profile section
                }
            }
        });
});


