function menu(){
    const menu = document.getElementById('menu');
    const menuContent = document.getElementById('menu-content');
    const typingContainer = document.getElementById('typing-container');
    const keyboard = document.getElementById('keyboard');
    const wordSettings = document.getElementById('word-settings');
    const app = document.getElementById('app');
    const match = document.getElementById('match');
    const resultsScreen = document.getElementById('results-screen');
    const pvpButton = document.getElementById('pvp');
    const practiceButton = document.getElementById('practice');
    const privateMatchButton = document.getElementById('privateMatch')
    
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
    if (typingContainer) typingContainer.style.display = 'none';
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
let typingContainer;
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
        const privateContainer = document.getElementById('playerTypingContainer');
        
        // Only send if we're in private match mode and match has started
        if (privateContainer && activeContainer === privateContainer && startTime) {
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
    
    // Clear progress timer if running
    if (privateMatchProgressInterval) {
        clearInterval(privateMatchProgressInterval);
        privateMatchProgressInterval = null;
    }

    // Show practice results overlay
    showPracticeResultsOverlay();
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
    const typingContainer = document.getElementById('typing-container');
    const keyboard = document.getElementById('keyboard');
    
    practiceResults.style.display = 'none';
    typingContainer.style.display = 'block';
    keyboard.style.display = 'block';
    
    // Scroll back to top
    typingContainer.scrollTop = 0;
    
    resetTypingVariables();
    displayRandomWords(getPracticeWords(currentWordCount));
}

// PvP-specific end race function
function handlePlayerFinish() {
    calculateStats();

    // Reset all keyboard key colors
    document.querySelectorAll('.key').forEach(key => {
        key.style.backgroundColor = '#ecdeaa';
    });

    // Set the PvP race complete flag to prevent further key presses
    pvpRaceComplete = true;
    
    // Clear progress timer if running
    if (privateMatchProgressInterval) {
        clearInterval(privateMatchProgressInterval);
        privateMatchProgressInterval = null;
    }

    // Clean up PvP socket events
    socket.off('typingProgressReceived');
    socket.off('opponentDisconnected');

    // Update PvP results in the overlay
    document.getElementById('typingSpeed').textContent = `Words Per Minute: ${typingSpeed}`;
    document.getElementById('accuracy').textContent = `Accuracy: ${accuracy}%`;
    
    // Show results overlay
    socket.emit('raceOver');
    
    finishAnimation(true); // You won!
    setTimeout(() => {
        showPvPResultsOverlay();
    }, 4000);
 
} 

function calculateStats(){
    const endTime = new Date();

    // Use match time for PvP, personal time for practice
    typingTime = getMatchElapsedTime() || (endTime - startTime);
    typingSpeed = Math.floor((correctWords / typingTime) * 60000);
    accuracy = Math.floor((correctChars / (totalChars - 1)) * 100);
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
    const queueMenu = document.getElementById('queueMenu');
    
    // Hide all PvP-related elements
    resultsScreen.style.display = 'none';
    resultsScreen.style.position = '';
    resultsScreen.style.zIndex = '';
    match.style.display = 'none';
    
    // Hide queue menu and reset its state
    if (queueMenu) {
        queueMenu.style.display = 'none';
        queueMenu.classList.remove('active');
    }

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
    const playerContainer = document.getElementById('player-typing-container');
    const oppContainer = document.getElementById('opp-typing-container');
    if (playerContainer) playerContainer.innerHTML = '';
    if (oppContainer) oppContainer.innerHTML = '';
    

    
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
        

        calculateStats();
        // Set PvP race complete to prevent further typing
        pvpRaceComplete = true;

        
        // Reset all keyboard key colors
        document.querySelectorAll('.key').forEach(key => {
            key.style.backgroundColor = '#ecdeaa';
        });
        
        // Get opponent name from the label
        const oppLabel = document.querySelector('#oppTypingArea .typing-area-label');
        const opponentName = oppLabel ? oppLabel.textContent : 'Opponent';
        
        finishAnimation(false, opponentName); // Opponent won!
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
        
        const oppContainer = document.getElementById('opp-typing-container');
        if (oppContainer) {
            oppContainer.innerHTML = data.htmlContent;
            const oppCursor = oppContainer.querySelector('.cursor');
            
            if (oppCursor) {
                const containerRect = oppContainer.getBoundingClientRect();
                const oppCursorRect = oppCursor.getBoundingClientRect();

                // Check if the cursor is below the visible area of the container
                if (oppCursorRect.bottom + 40 > containerRect.bottom) {
                    // Scroll down to bring the cursor into view
                    oppContainer.scrollTop += 20;
                }
                // Check if the cursor moved above the visible area (e.g., due to backspace near the top)
                else if (oppCursorRect.top < containerRect.top + 40) {
                    // Scroll up to bring the cursor into view
                    oppContainer.scrollTop -= 20;
                }
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
});

socket.on('matchFound', (data) => {
    console.log('Match found!');
    console.log('Your opponent is:', data.opponent);
    console.log('Room ID:', data.roomId);
    const queueMenu = document.getElementById('queueMenu');
    const match = document.getElementById('match');
    const playerContainer = document.getElementById('player-typing-container');
    const oppLabel = document.querySelector('#oppTypingArea .typing-area-label');
    
    // Setup socket events for this match
    setupPvPSocketEvents();
    
    if (match) {
        // Hide the queue menu and show the match container
        queueMenu.style.display = 'none';
        match.style.display = 'block';
        
        // Update opponent label with their name
        if (oppLabel) {
            oppLabel.textContent = data.opponent;
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

            // Send initial words to opponent (without key data)
            if (playerContainer) {
                socket.emit('typingProgress', {
                    htmlContent: playerContainer.innerHTML
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

const queueClickHandler = function() {
    if (this.textContent !== "Finding Match..."){
        this.style.animation = 'textChange 0.5s ease';
        setTimeout(() => {
            this.textContent = 'Finding Match...';
            // Emit queue event to server
            socket.emit('queueMatch');
        }, 250);
    }

    else{
        this.style.animation = 'textChange 0.5s ease';
        setTimeout(() => {
            this.textContent = 'Find Match';
        }, 250);
        socket.emit('leaveQueue');
    }
}

if (pvpButton) {
pvpButton.addEventListener('click', function() {
    const menu = document.getElementById('menu');
    menuContent.style.opacity = '0';
    menuContent.style.transform = 'scale(0.8)';
    setTimeout(() => {
        menu.style.display = 'none';
        menuContent.style.display = 'none';
        
        // Get the existing queue button and reset its state
        const queueButton = document.getElementById('queueBtn');
        queueButton.textContent = 'Find Match';
        
        queueMenu.classList.add('active');
        queueMenu.style.display = 'block';
        queueMenu.style.opacity = '1';
        queueMenu.style.transform = 'translate(-50%, -50%) scale(1)';

        // Add click event listener to the queue button    
        if (queueButton) {
            queueButton.addEventListener('click', queueClickHandler);
        }
    }, 300);
});
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
    }
    
    // Show user feedback
    alert('You are already in queue from another tab/window');
});

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
    const playerContainer = document.getElementById('player-typing-container');
    if (playerContainer && activeContainer === playerContainer) {
        const wasCorrect = currentSpan.classList.contains('matched');
        socket.emit('typingProgress', {
            htmlContent: playerContainer.innerHTML,
            keyPressed: event.key,
            keyCorrect: wasCorrect
        });
    }

    // Progress updates for private matches are now handled by the timer function
    // No need to send on every keypress since we send every second

    // Scroll handling: Keep the cursor visible
    if (cursor) {
        const containerRect = activeContainer.getBoundingClientRect();
        const cursorRect = cursor.getBoundingClientRect();

        // Check if the cursor is below the visible area of the container
        const buffer = activeContainer.id === 'player-typing-container' ? 40 : 80;
        if (cursorRect.bottom + buffer > containerRect.bottom) {
            // Scroll down to bring the cursor into view (smaller scroll amount)
            activeContainer.scrollTop += 20; // Smaller scroll increment
        }
        // Check if the cursor moved above the visible area (e.g., due to backspace near the top)
        else if (cursorRect.top < containerRect.top + buffer) {
            // Scroll up to bring the cursor into view (smaller scroll amount)
            activeContainer.scrollTop -= 20; // Smaller scroll increment
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
        const chars = word.querySelectorAll('.char:not(:empty)');
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

    // Check if we've reached the last character before the empty span
    if (keysPressed === totalChars - 1) {
        const lastWord = words[words.length - 1];
        
        // Check if all non-empty characters in the last word are matched
        const lastWordChars = lastWord.querySelectorAll('.char:not(:empty)');
        let lastWordMatched = true;
        
        lastWordChars.forEach(char => {
            if (!char.classList.contains('matched')) {
                lastWordMatched = false;
            }
        });
        
        if (lastWordMatched && lastWordChars.length > 0) {
            // Check if we're in PvP mode or private match mode
            const playerContainer = document.getElementById('player-typing-container');
            const privateContainer = document.getElementById('playerTypingContainer');
            const isPvPMode = playerContainer && activeContainer === playerContainer;
            const isPrivateMode = privateContainer && activeContainer === privateContainer;
            
            if (isPvPMode) {
                handlePlayerFinish();
            } else if (isPrivateMode) {
                // For private matches, send finished signal and let the timer handle completion
                socket.emit('privateMatchProgress', {
                    progress: correctChars,
                    totalChars: keysPressed,
                    finished: true
                });
                // Don't call endTest() - the timer will handle it
            } else {
                endTest();
            }
        }
    }
});

// Function to manage keyboard key colors
function colorKey(color, keyId) {
    // Determine which keyboard to target based on current mode
    const activeContainer = getActiveTypingContainer();
    const playerContainer = document.getElementById('player-typing-container');
    const privateContainer = document.getElementById('playerTypingContainer');
    
    const isPvPMode = playerContainer && activeContainer === playerContainer;
    const isPrivateMode = privateContainer && activeContainer === privateContainer;
    

    
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
        return document.getElementById('playerTypingContainer');
    }
    
    // Check for PVP match mode
    const match = document.getElementById('match');
    if (match && match.style.display === 'block') {
        return document.getElementById('player-typing-container');
    } 
    
    // Default to practice mode
        return document.getElementById('typing-container');
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

function cleanupPrivateMatchListeners() {
    // Clear progress timer
    if (privateMatchProgressInterval) {
        clearInterval(privateMatchProgressInterval);
        privateMatchProgressInterval = null;
    }
    
    // Stop the match timer if it's running
    const timer = document.querySelector('match-timer-component');
    if (timer && timer.matchTimer) {
        clearInterval(timer.matchTimer);
    }
    
    // Clean up socket listeners that are specific to private matches
    socket.off('privateMatchEnded');
    socket.off('privateMatchStarted');
    socket.off('leaderboardUpdate');
    socket.off('playerJoined');
    socket.off('playerLeft');
    
    // Reset typing state
    testComplete = true;
    pvpRaceComplete = true;
    
    // Reset keyboard colors
    document.querySelectorAll('.key').forEach(key => {
        key.style.backgroundColor = '#ecdeaa';
    });
    
    console.log('Private match listeners cleaned up');
}

function showFinalLeaderboard(playerStats) {
    // Clean up private match listeners and state
    cleanupPrivateMatchListeners();
    finalLeaderboardOverlay.style.display = 'block';
    
    // Create a full-screen overlay for final results
    const finalLeaderboardOverlay = document.createElement('div');
    finalLeaderboardOverlay.id = 'final-results-overlay';

    // Create the results container
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'final-results-container';

    // Create title
    const title = document.createElement('h1');
    title.textContent = '🏆 FINAL RESULTS 🏆';
    title.className = 'final-results-title';

    // Create rankings container
    const rankingsContainer = document.createElement('div');
    rankingsContainer.id = 'final-rankings';

    // Sort players by WPM (highest first)
    const sortedPlayers = Object.entries(playerStats).sort((a, b) => {
        if (b[1].finalWpm === a[1].finalWpm) {
            return b[1].finalAccuracy - a[1].finalAccuracy;
        }
        else {
            return b[1].finalWpm - a[1].finalWpm;
        }
    });

    // Create player rank cards
    sortedPlayers.forEach((player, index) => {
        const [playerName, stats] = player;
        const rank = index + 1;
        
        const playerCard = document.createElement('div');
        playerCard.className = `player-rank-card rank-${rank <= 3 ? rank : 'other'}`;
        playerCard.style.animationDelay = `${index * 0.2}s`;

        const rankText = document.createElement('div');
        rankText.textContent = `#${rank}`;
        rankText.className = 'player-rank-number';

        const playerInfo = document.createElement('div');
        playerInfo.className = 'player-info';

        const playerNameDiv = document.createElement('div');
        playerNameDiv.textContent = playerName;
        playerNameDiv.className = 'player-name-final';

        const playerStatsDiv = document.createElement('div');
        playerStatsDiv.textContent = `${stats.finalWpm} WPM | ${stats.finalAccuracy}% Accuracy`;
        playerStatsDiv.className = 'player-stats-final';

        playerInfo.appendChild(playerNameDiv);
        playerInfo.appendChild(playerStatsDiv);
        playerCard.appendChild(rankText);
        playerCard.appendChild(playerInfo);
        rankingsContainer.appendChild(playerCard);
    });

    // Create back to menu button
    const backButton = document.createElement('button');
    backButton.textContent = 'Back to Menu';
    backButton.className = 'final-back-button';

    backButton.addEventListener('click', () => {
        // Just redirect to menu (cleanup already done)
        window.location.href = '/';
    });

    // Assemble the overlay
    resultsContainer.appendChild(title);
    resultsContainer.appendChild(rankingsContainer);
    resultsContainer.appendChild(backButton);
    finalLeaderboardOverlay.appendChild(resultsContainer);
    document.body.appendChild(finalLeaderboardOverlay);
}

// Prevent manual scrolling on typing containers
function preventManualScrolling() {
    const containers = ['typing-container', 'player-typing-container', 'opp-typing-container', 'playerTypingContainer'];
    
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
    // Only call menu() on index.html (check if menu element exists)
    if (document.getElementById('menu')) {
        menu();
    }
    
    // Prevent manual scrolling
    preventManualScrolling();

    // Practice mode button handler (only exists on index.html)
    const practiceButton = document.querySelector('#practice');
    if (practiceButton) {
        practiceButton.addEventListener('click', function() {
        const menu = document.getElementById('menu');
        const wordSettings = document.getElementById('word-settings');
        const typingContainer = document.getElementById('typing-container');
        const keyboard = document.getElementById('keyboard');
        const menuContent = document.getElementById('menu-content');
        const app = document.getElementById('app');
        
        // Hide menu and show app
        menu.style.display = 'none';
        menuContent.style.display = 'none';
        app.style.display = 'block';
        wordSettings.style.display = 'block';
        typingContainer.style.display = 'block';
        keyboard.style.display = 'block';
        
        // Hide PvP keyboards
        const playerKeyboard = document.getElementById('player-keyboard');
        const oppKeyboard = document.getElementById('opp-keyboard');
        if (playerKeyboard) playerKeyboard.style.display = 'none';
        if (oppKeyboard) oppKeyboard.style.display = 'none';
        
        // Initialize the typing session
        resetTypingVariables();
        displayRandomWords(getPracticeWords(25));
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
            const typingContainer = document.getElementById('typing-container');

            // Hide the results screen and show the typing container
            typingContainer.style.display = 'block';
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

    // Listen for incoming invitations (works on all pages)
    socket.on('inviteReceived', (data) => {
        console.log('Received invite from:', data.inviter);
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
                if (popup) {
                    popup.classList.remove('show');
                    socket.emit('acceptInvite', {privateRoomId: data.privateRoomId});
                }
            }
        }

        if (rejectBtn) {
            rejectBtn.onclick = () => {
                if (popup) {
                    popup.classList.remove('show');
                    socket.emit('rejectInvite', {privateRoomId: data.privateRoomId});
                }
            }
        }
    });

    // Handle redirect to private room after accepting invite
    socket.on('redirectToRoom', (roomId) => {
        window.location.href = `/privatematch.html?room=${roomId}&redirected=true`;
                
    });

    socket.on('leaderboardUpdate', (data) => {
        updateLeaderboard(data.playerStats);
    });
};


