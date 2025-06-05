// Word list for random word generation
const words = [
    "apple", "banana", "desk", "car", "chair", "tree", "phone", "book", "pen", "light",
    "rain", "shoes", "house", "cat", "dog", "bird", "fish", "jump", "run", "sleep",
    "mirror", "window", "computer", "keyboard", "bottle", "basket", "notebook", "pencil", "bottle",
    "table", "walking", "driving", "reading", "writing", "teacher", "student", "family", "city", "country",
    "vacation", "architecture", "literature", "mathematics", "democracy", "revolution", "psychology",
    "philosophy", "freedom", "technology", "motivation", "imagination", "humanity", "development",
    "independent", "experience", "discovery", "creation", "evolution", "perception", "molecule", "gravity",
    "galaxy", "physics", "biology", "chemistry", "experiment", "formula", "reaction", "atom", "energy",
    "universe", "ecosystem", "evolution", "organism", "chromosome", "radiation", "solution", "temperature",
    "pressure", "anticipation", "appreciation", "accomplishment", "collaboration", "sophistication",
    "development", "creativity", "innovation", "concentration", "negotiation", "transformation", "reflection",
    "responsibility", "sustainability", "comprehension", "determination", "calculation", "connection",
    "realization", "motivation", "bamboozle", "subjugate", "flamboyant", "juxtapose", "ephemeral", "serendipity",
    "quintessence", "catharsis", "plethora", "cryptic", "mnemonic", "labyrinth", "rhetoric", "scintillating",
    "eloquence", "kaleidoscope", "transcendence", "nebulous", "fortuitous", "abyss", "algorithm", "function",
    "variable", "loop", "array", "object", "class", "string", "integer", "index", "binary", "module",
    "framework", "debug", "compiler", "encryption", "database", "repository", "version", "objectivity"
]

function menu(){
    const menuContent = document.getElementById('menu-content');
    const typingContainer = document.getElementById('typing-container');
    const keyboard = document.getElementById('keyboard');
    const wordSettings = document.getElementById('word-settings');
    const app = document.getElementById('app');
    const match = document.getElementById('match');
    const resultsScreen = document.getElementById('results-screen');
    
    menuContent.style.display = 'flex';
    app.style.display = 'none';
    match.style.display = 'none';
    wordSettings.style.display = 'none';
    typingContainer.style.display = 'none';
    keyboard.style.display = 'none';
    resultsScreen.style.display = 'none';
}

// Function to get random words from the word list
function getRandomWords(count) {
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

// Function to display random words in the typing container
function displayRandomWords(count = 25) {
    const randomWords = getRandomWords(count);
    typingContainer = document.getElementById("typing-container");

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
            wrappedText2 += `<span id="char-${i}" class="char space"> </span>`;
            i++;
        } else {
            wrappedText2 += `<span id="char-${i}" class="char"></span>`;
            i++;
        }
        wrappedText2 += `</div>`;
    });
    
    typingContainer.innerHTML = wrappedText2;
    console.log('Total characters:', i);
    totalChars = i;
}

// function that starts the test
function startTest() {
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
}

// end of test function
function endTest(){
    const endTime = new Date();

    typingTime = endTime - startTime;
    typingSpeed = Math.floor((correctWords / typingTime) * 60000);
    console.log('Correct chars:', correctChars);
    console.log('Total chars:', totalChars);

    accuracy = Math.floor((correctChars / (totalChars - 1)) * 100);     
    
    // Reset all keyboard key colors
    document.querySelectorAll('.key').forEach(key => {
        key.style.backgroundColor = '#ecdeaa';
    });
    
    console.log("End test ran successfully!");
    
    // Set the test complete flag to prevent further key presses
    testComplete = true;

    const typingContainer = document.getElementById('typing-container');
    const resultsScreen = document.getElementById('results-screen');
    const keyboard = document.getElementById('keyboard');
    
    typingContainer.style.display = 'none';
    keyboard.style.display = 'none';
    resultsScreen.style.display = 'block';

    // Display WPM and accuracy
    resultsScreen.innerHTML = `
        <h2>Results</h2>
        <div class="stats">
            <p>Words Per Minute: <span class="highlight">${typingSpeed}</span></p>
            <p>Accuracy: <span class="highlight">${accuracy}%</span></p>
        </div>
        <button onclick="restartTest()" style="margin-top: 20px; padding: 10px 20px; font-size: 16px; background-color: #ecdda5; border: 2px solid #2c3e50; border-radius: 8px; cursor: pointer; font-family: 'Ubuntu', Courier, monospace;">Try Again</button>
    `;
}

function restartTest() {
    const resultsScreen = document.getElementById('results-screen');
    const typingContainer = document.getElementById('typing-container');
    const keyboard = document.getElementById('keyboard');
    
    resultsScreen.style.display = 'none';
    typingContainer.style.display = 'block';
    keyboard.style.display = 'block';
    
    startTest();
    displayRandomWords(25);
}

// Initialize Socket.IO connection
const socket = io();

socket.on('username assigned', (username) => {
    console.log('Assigned username:', username);
});

socket.on('queueJoined', () => {
    console.log('Successfully joined the queue');
});

socket.on('matchFound', (data) => {
    console.log('Match found!');
    console.log('Your opponent is:', data.opponent);
    const queueMenu = document.getElementById('queueMenu');
    const match = document.getElementById('match');
    const playerContainer = document.getElementById('player-typing-container');
    const oppLabel = document.querySelector('#oppTypingArea .typing-area-label');
    
    if (match) {
        // Hide the queue menu and show the match container
        queueMenu.style.display = 'none';
        match.style.display = 'block';
        
        // Update opponent label with their name
        if (oppLabel) {
            oppLabel.textContent = data.opponent;
        }
        
        // Hide practice mode elements
        document.getElementById('keyboard').style.display = 'none';
        
        // Show PvP keyboards
        document.getElementById('player-keyboard').style.display = 'block';
        document.getElementById('opp-keyboard').style.display = 'block';
        
        // Initialize the player's typing test
        startTest();
        displayRandomWords(25);
        
        // Move the generated content to the player's PvP container
        const mainTypingContainer = document.getElementById('typing-container');
        playerContainer.innerHTML = mainTypingContainer.innerHTML;
        
        // Update the global reference for typing logic
        typingContainer = playerContainer;

        // Send initial words to opponent
        socket.emit('words', playerContainer.innerHTML);
    }
});

// Handle received words from opponent
socket.on('wordsReceived', (data) => {
    const oppContainer = document.getElementById('opp-typing-container');
    if (oppContainer) {
        oppContainer.innerHTML = data;
        const oppCursor = oppContainer.querySelector('.cursor');
        
        if (oppCursor) {
            const containerRect = oppContainer.getBoundingClientRect();
            const oppCursorRect = oppCursor.getBoundingClientRect();
            const padding = 40;

            // Get current transform value
            const currentTransform = oppContainer.style.transform || 'translateY(0px)';
            const currentY = parseFloat(currentTransform.match(/-?\d+\.?\d*/)?.[0] || 0);

            // Check if the cursor is below the visible area of the container
            if (oppCursorRect.bottom + padding > containerRect.bottom) {
                const scrollAmount = oppCursorRect.bottom + padding - containerRect.bottom + 10;
                oppContainer.style.transform = `translateY(${currentY - scrollAmount}px)`;
            }
            // Check if the cursor moved above the visible area (e.g., due to backspace near the top)
            else if (oppCursorRect.top < containerRect.top + 10) {
                const scrollAmount = (containerRect.top + 10) - oppCursorRect.top + 10;
                oppContainer.style.transform = `translateY(${currentY + scrollAmount}px)`;
            }
        }
    }
});

const pvpButton = document.getElementById('pvp');
const queueMenu = document.getElementById('queueMenu');
const menuContent = document.getElementById('menu-content');

pvpButton.addEventListener('click', function() {
    menuContent.style.opacity = '0';
    menuContent.style.transform = 'scale(0.8)';
    setTimeout(() => {
        menuContent.style.display = 'none';
        queueMenu.innerHTML = '<button class="queue-button">Find Match</button>';
        queueMenu.classList.add('active');
        
        // Add click event listener to the queue button
        const queueButton = queueMenu.querySelector('.queue-button');
        queueButton.addEventListener('click', function() {
            this.style.animation = 'textChange 0.5s ease';
            setTimeout(() => {
                this.textContent = 'Finding Match...';
                // Emit queue event to server
                socket.emit('queueMatch');
            }, 250);
        });
    }, 300);
});

// Event listener for typing and backspace handling
document.addEventListener('keydown', function(event) {
    if (event.key === ' ') {
        event.preventDefault(); // Prevent space bar from scrolling
    }
    
    if (testComplete) {
        event.preventDefault();
        return;
    }
    
    if (!typingContainer || typingContainer.style.display === 'none') {
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
            const prevSpan = typingContainer.querySelector(`#char-${keysPressed}`);
            if (prevSpan) {
                prevSpan.classList.remove("matched", "unmatched");
                const cursor = typingContainer.querySelector('.cursor');
                if (cursor && prevSpan.parentNode) {
                    prevSpan.parentNode.insertBefore(cursor, prevSpan);
                }
            }
        }
        return;
    }
    
    const currentSpan = typingContainer.querySelector(`#char-${keysPressed}`);
    if (!currentSpan) return;
    
    const currentLetter = currentSpan.textContent;
    
    if (event.key === currentLetter) {
        currentSpan.classList.add("matched");
        colorKey('green', event.key);
        correctChars++; // Increment correctChars for accurate typing
    } else {
        currentSpan.classList.add("unmatched");
        colorKey('red', event.key);
    }

    keysPressed++;
    
    const nextSpan = typingContainer.querySelector(`#char-${keysPressed}`);
    const cursor = typingContainer.querySelector('.cursor');
    if (nextSpan && cursor && nextSpan.parentNode) {
        nextSpan.parentNode.insertBefore(cursor, nextSpan);
    }

    // Send current typing progress to opponent (only in PvP mode)
    const playerContainer = document.getElementById('player-typing-container');
    if (playerContainer && typingContainer === playerContainer) {
        socket.emit('words', playerContainer.innerHTML);
    }

    // Scroll handling: Keep the cursor visible using transform
    if (cursor) {
        const containerRect = typingContainer.getBoundingClientRect();
        const cursorRect = cursor.getBoundingClientRect();
        const padding = 40;

        // Get current transform value
        const currentTransform = typingContainer.style.transform || 'translateY(0px)';
        const currentY = parseFloat(currentTransform.match(/-?\d+\.?\d*/)?.[0] || 0);

        // Check if the cursor is below the visible area of the container
        if (cursorRect.bottom + padding > containerRect.bottom) {
            const scrollAmount = cursorRect.bottom + padding - containerRect.bottom + 20;
            typingContainer.style.transform = `translateY(${currentY - scrollAmount}px)`;
        }
        // Check if the cursor moved above the visible area (e.g., due to backspace near the top)
        else if (cursorRect.top < containerRect.top + 20) {
            const scrollAmount = (containerRect.top + 20) - cursorRect.top + 20;
            typingContainer.style.transform = `translateY(${currentY + scrollAmount}px)`;
        }
    }
});

document.addEventListener('keyup', function(event) {
    // If the test is complete, don't process any key lifts except for color reset
    if (testComplete) {
        return;
    }
    
    if (!typingContainer || typingContainer.style.display === 'none') {
        return; // Don't process keys if not in typing mode
    }
    
    colorKey('#ecdeaa', event.key);

    // Check word completion and update correctWords count
    const words = typingContainer.querySelectorAll('.word');
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
            endTest();
            console.log('Test ended successfully - last word matched!');
        }
    }
});

// Function to manage keyboard key colors
function colorKey(color, keyId) {
    // Determine which keyboard to target based on current mode
    const playerContainer = document.getElementById('player-typing-container');
    const isPvPMode = playerContainer && typingContainer === playerContainer;
    
    // Special handling for spacebar
    if (keyId === ' ') {
        if (isPvPMode) {
            const playerSpacebar = document.querySelector('#player-keyboard #space');
            if (playerSpacebar) {
                playerSpacebar.style.backgroundColor = color;
            }
        } else {
            const spacebarElement = document.getElementById('space');
            if (spacebarElement) {
                spacebarElement.style.backgroundColor = color;
            }
        }
        return;
    }
    
    // Handle regular keys
    if (isPvPMode) {
        const playerKey = document.querySelector(`#player-keyboard #${keyId.toUpperCase()}`);
        if (playerKey) {
            playerKey.style.backgroundColor = color;
        }
    } else {
        const keybutton = document.getElementById(keyId.toUpperCase());
        if (keybutton) {
            keybutton.style.backgroundColor = color;
        }
    }
}   

// Function to setup PvP keyboards by cloning the main keyboard
function setupPvPKeyboards() {
    const originalKeyboard = document.getElementById('keyboard');
    
    // Clone and setup player keyboard
    const playerKeyboard = originalKeyboard.cloneNode(true);
    playerKeyboard.id = 'player-keyboard';
    playerKeyboard.className = 'keyboard pvp-keyboard';
    playerKeyboard.style.display = 'none';
    document.getElementById('player-keyboard-container').appendChild(playerKeyboard);
    
    // Clone and setup opponent keyboard
    const oppKeyboard = originalKeyboard.cloneNode(true);
    oppKeyboard.id = 'opp-keyboard';
    oppKeyboard.className = 'keyboard pvp-keyboard';
    oppKeyboard.style.display = 'none';
    document.getElementById('opp-keyboard-container').appendChild(oppKeyboard);
}

// Prevent manual scrolling on typing containers
function preventManualScrolling() {
    const containers = ['typing-container', 'player-typing-container', 'opp-typing-container'];
    
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
    menu();
    
    // Setup PvP keyboards
    setupPvPKeyboards();
    
    // Prevent manual scrolling
    preventManualScrolling();

    // Practice mode button handler
    document.querySelector('#practice').addEventListener('click', function() {
        const wordSettings = document.getElementById('word-settings');
        const typingContainer = document.getElementById('typing-container');
        const keyboard = document.getElementById('keyboard');
        const menuContent = document.getElementById('menu-content');
        const app = document.getElementById('app');
        
        // Hide menu and show app
        menuContent.style.display = 'none';
        app.style.display = 'block';
        wordSettings.style.display = 'block';
        typingContainer.style.display = 'block';
        keyboard.style.display = 'block';
        
        // Hide PvP keyboards
        document.getElementById('player-keyboard').style.display = 'none';
        document.getElementById('opp-keyboard').style.display = 'none';
        
        // Initialize the typing test
        startTest();
        displayRandomWords(25);
    });
    
    // Set up word count selection listeners after DOM is loaded
    document.querySelectorAll('.word-count').forEach(element => {
        element.addEventListener('click', function() {
            const wordCount = parseInt(this.dataset.count);
            const resultsScreen = document.getElementById('results-screen');
            const keyboard = document.getElementById('keyboard');
            const typingContainer = document.getElementById('typing-container');

            // Hide the results screen and show the typing container
            typingContainer.style.display = 'block';
            keyboard.style.display = 'block';
            resultsScreen.style.display = 'none';
            
            // Reset and start new test
            startTest();
            displayRandomWords(wordCount);
        });
    });
};
