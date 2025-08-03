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
    
    if (profile) profile.style.display = 'flex';
    
    // Hide other sections
    if (app) app.style.display = 'none';
    if (match) match.style.display = 'none';
    if (wordSettings) wordSettings.style.display = 'none';
    if (practiceContainer) practiceContainer.style.display = 'none';
    if (keyboard) keyboard.style.display = 'none';
    if (resultsScreen) resultsScreen.style.display = 'none';
    
    // Show menu
    if (menu) menu.style.display = 'block';
    if (menuContent) {
        menuContent.style.display = 'flex';
        menuContent.style.opacity = '1';
        menuContent.style.transform = 'scale(1)';
    }
    if (pvpButton) pvpButton.style.display = 'block';
    if (practiceButton) practiceButton.style.display = 'block';
    if (privateMatchButton) privateMatchButton.style.display = 'block';
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
window.countdownActive = false; // Flag to track if countdown is active
let currentWordCount = 25;
let privateMatchProgressInterval = null; // Timer for sending progress updates

// Global container references
const practiceContainer = document.getElementById('practice-container');
const pvpPlayerContainer = document.getElementById('pvp-player-container');
const pvpOpponentContainer = document.getElementById('pvp-opponent-container');
const privatePlayerContainer = document.getElementById('private-player-container');

function showMyProfilePopup() {
    const profilePopupOverlay = document.getElementById('profilePopupOverlay');
    profilePopupOverlay.style.display = 'flex';
    
    // Trigger animation after display is set
    setTimeout(() => {
        profilePopupOverlay.classList.add('show');
    }, 10);

    fetch('/api/userprofile')
        .then(response => response.json())
        .then(data => {
            console.log('Profile data received:', data);
            console.log('Profile picture URL:', data.profilePicture);
            
            const playerUsername = document.getElementById('playerUsername');
            const creationDate = document.getElementById('creationDate');
            const playerProfilePicture = document.getElementById('playerProfilePicture');
            const aboutMe = document.getElementById('aboutMe');

            const totalTypingTime = document.getElementById('totalTypingTime');

            playerUsername.textContent = data.username;
            creationDate.textContent = `JOINED ${new Date(data.creationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`.toUpperCase();
            // Use the proxy route for the profile picture to avoid CORS issues
            const profileImg = document.createElement('img');
            if (data.profilePicture && data.profilePicture.startsWith('data:image/')) {
                // Handle base64 data directly
                profileImg.src = data.profilePicture;
            } else {
                // Handle URL data with proxy
            profileImg.src = `/proxy-image?url=${encodeURIComponent(data.profilePicture)}`;
            }
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
            
            // Display about me text
            const aboutMeContent = document.getElementById('aboutMeContent');
            if (aboutMeContent) {
                if (data.aboutMe && data.aboutMe.trim() !== '') {
                    aboutMeContent.textContent = data.aboutMe;
                } else {
                    aboutMeContent.textContent = 'No about me text yet.';
                }
            }
            
            totalTypingTime.textContent = `Total Typing Time: ${formatTime(data.totalTypingTime || 0)}`;
        })
        .catch(error => {
            console.error('Error loading profile data:', error);
        });
}

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


const userSearch = document.getElementById('searchInput');

if (userSearch) {
    console.log('Search input found, adding event listener');
    userSearch.addEventListener('keypress', (e) => {
        console.log('Key pressed:', e.key);
        if (e.key === ' ') {
            e.preventDefault();
        }
        if (e.key === 'Enter') {
            const searchValue = userSearch.value.trim();
            console.log('Search value:', searchValue);
            if (searchValue.length > 0) {
                console.log('Redirecting to:', `/profile/${searchValue}`);
                window.location.href = `/profile/${searchValue}`;
            }
        }
    });
} else {
    console.log('Search input NOT found!');
}

function hideMyProfilePopup() {
    const profilePopupOverlay = document.getElementById('profilePopupOverlay');
    profilePopupOverlay.classList.remove('show');
    
    // Hide after animation completes
    setTimeout(() => {
        profilePopupOverlay.style.display = 'none';
    }, 300);
}

const profile = document.getElementById('profile');
if (profile) {
    profile.addEventListener('click', () => {
        showMyProfilePopup();
    });
}

// Profile close button
const profileCloseBtn = document.getElementById('profileCloseBtn');
if (profileCloseBtn) {
    profileCloseBtn.addEventListener('click', () => {
        hideMyProfilePopup();
    });
}

// View full profile button
const viewFullProfileBtn = document.getElementById('viewFullProfileBtn');
console.log('viewFullProfileBtn found:', viewFullProfileBtn);
if (viewFullProfileBtn) {
    viewFullProfileBtn.addEventListener('click', () => {
        console.log('View full profile button clicked!');
        // Get the username from the currently displayed profile
        const playerUsername = document.getElementById('playerUsername');
        if (playerUsername && playerUsername.textContent) {
            const username = playerUsername.textContent;
            console.log('Redirecting to profile for username:', username);
            window.location.href = `/profile/${username}`;
        } else {
            console.error('No username found in profile popup');
            // Fallback to old URL if there's an error
            window.location.href = 'fullProfile.html';
        }
    });
    console.log('Event listener added to viewFullProfileBtn');
} else {
    console.log('viewFullProfileBtn NOT FOUND!');
}

// Close popup when clicking outside
const profilePopupOverlay = document.getElementById('profilePopupOverlay');
if (profilePopupOverlay) {
    profilePopupOverlay.addEventListener('click', (e) => {
        if (e.target === profilePopupOverlay) {
            hideMyProfilePopup();
        }
    });
}

// Function to show a profile popup for a specific user
function showProfilePopup(username) {
    const profilePopupOverlay = document.getElementById('profilePopupOverlay');
    const playerUsername = document.getElementById('playerUsername');
    const creationDate = document.getElementById('creationDate');
    const playerProfilePicture = document.getElementById('playerProfilePicture');
    const aboutMeContent = document.getElementById('aboutMeContent');
    const totalTypingTime = document.getElementById('totalTypingTime');

    // Show the popup first
    profilePopupOverlay.style.display = 'flex';
    setTimeout(() => {
        profilePopupOverlay.classList.add('show');
    }, 10);

    fetch(`/api/userprofile/${username}`)
        .then(response => response.json())
        .then(data => {
            playerUsername.textContent = data.username;
            creationDate.textContent = `JOINED ${new Date(data.creationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`.toUpperCase();
            // Use the proxy route for the profile picture to avoid CORS issues
            const profileImg = document.createElement('img');
            if (data.profilePicture && data.profilePicture.startsWith('data:image/')) {
                // Handle base64 data directly
                profileImg.src = data.profilePicture;
            } else {
                // Handle URL data with proxy
            profileImg.src = `/proxy-image?url=${encodeURIComponent(data.profilePicture)}`;
            }
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
            aboutMeContent.textContent = data.aboutMe || 'No about me text yet.';
            totalTypingTime.textContent = `Total Typing Time: ${formatTime(data.totalTypingTime || 0)}`;
        })
        .catch(error => {
            console.error('Error loading profile data:', error);
        });
}

function sendFriendRequest(username) {
    fetch('/api/sendFriendRequest', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ toUsername: username })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || 'Failed to send friend request');
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Friend request sent:', data.message);
        
        // Visual feedback - update the button
        const button = document.querySelector(`.friend-add-btn[onclick*="${username}"]`);
        if (button) {
            button.textContent = 'Request Sent!';
            button.style.backgroundColor = '#27ae60'; // Green
            button.disabled = true;
        }
    })
    .catch(error => {
        console.error('Error:', error.message);
        
        // Visual feedback for error
        const button = document.querySelector(`.friend-add-btn[onclick*="${username}"]`);
        if (button) {
            button.textContent = 'Failed';
            button.style.backgroundColor = '#e74c3c'; // Red
            setTimeout(() => {
                button.textContent = 'Send Friend Request';
                button.style.backgroundColor = '#3498db'; // Back to blue
                button.disabled = false;
            }, 2000);
        }
        
        // Show error message to user
        alert(error.message);
    });
}

// Load friend requests
function loadFriendRequests() {
    fetch('/api/getFriendRequests')
    .then(response => response.json())
    .then(data => {
        console.log('Friend requests:', data);
        
        const friendRequestsList = document.getElementById('friendRequestsList');
        
        if (data.requests && data.requests.length > 0) {
            // Show the friend requests
            let requestsHTML = '';
            data.requests.forEach(request => {
                requestsHTML += `
                    <div class="friend-request-item">
                        <div class="friend-request-info">
                            <img src="${getProfilePictureUrl(request.pfpUrl)}" alt="Profile" class="friend-request-avatar" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2240%22 fill=%22%23bdc3c7%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 font-size=%2230%22 fill=%22%237f8c8d%22>👤</text></svg>'">
                            <div class="friend-request-details">
                                <div class="friend-request-name">${request.fromUser}</div>
                                <div class="friend-request-date">${new Date(request.dateSent).toLocaleDateString()}</div>
                            </div>
                        </div>
                        <div class="friend-request-buttons">
                            <button class="accept-friend-btn" onclick="respondToFriendRequest(${request.id}, 'accept')">Accept</button>
                            <button class="reject-friend-btn" onclick="respondToFriendRequest(${request.id}, 'reject')">Reject</button>
                        </div>
                    </div>
                `;
            });
            friendRequestsList.innerHTML = requestsHTML;
        } else {
            // Show "no requests" message
            friendRequestsList.innerHTML = '<div class="no-friends">No friend requests</div>';
        }
    })
    .catch(error => {
        console.error('Error loading friend requests:', error);
        const friendRequestsList = document.getElementById('friendRequestsList');
        friendRequestsList.innerHTML = '<div class="no-friends">Error loading friend requests</div>';
    });
}

// Global variable to track current friends
let currentFriendsList = [];
let friendsRefreshInterval = null;

// Load friends list
function loadFriendsList() {
    fetch('/api/listFriends')
    .then(response => response.json())
    .then(data => {
        console.log('Friends:', data);
        currentFriendsList = data.friends || [];
        
        const friendsList = document.getElementById('friendsList');
        
        if (data.friends && data.friends.length > 0) {
            // Show the friends
            let friendsHTML = '';
            data.friends.forEach(friend => {
                friendsHTML += `
                    <div class="friend-item">
                        <div class="friend-content" onclick="showProfilePopup('${friend.friendUsername}')">
                            <img src="${getProfilePictureUrl(friend.pfpUrl)}" alt="Profile" class="friend-avatar" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2240%22 fill=%22%23bdc3c7%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 font-size=%2230%22 fill=%22%237f8c8d%22>👤</text></svg>'">
                        <div class="friend-details">
                            <div class="friend-name">${friend.friendUsername}</div>
                            <div class="friend-stats">Friend since ${new Date(friend.dateAdded).toLocaleDateString()}</div>
                        </div>
                        </div>
                        <button class="remove-friend-btn" onclick="removeFriend('${friend.friendUsername}')">Remove</button>
                    </div>
                `;
            });
            friendsList.innerHTML = friendsHTML;
        } else {
            // Show "no friends" message
            friendsList.innerHTML = '<div class="no-friends">No friends yet</div>';
        }
    })
    .catch(error => {
        console.error('Error loading friends list:', error);
        const friendsList = document.getElementById('friendsList');
        friendsList.innerHTML = '<div class="no-friends">Error loading friends</div>';
    });
}

// Remove friend function
function removeFriend(friendUsername) {
    if (confirm(`Are you sure you want to remove ${friendUsername} as a friend?`)) {
        fetch('/api/removeFriend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ friendUsername })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error || 'Failed to remove friend');
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Friend removed:', data.message);
            // Reload the friends list
            loadFriendsList();
        })
        .catch(error => {
            console.error('Error removing friend:', error);
            alert(error.message);
        });
    }
}

// Respond to friend request
function respondToFriendRequest(requestId, action) {
    fetch('/api/respondToFriendRequest', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requestId, action })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || 'Failed to respond to friend request');
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Friend request response:', data.message);
        
        // Reload both friend requests and friends list
        loadFriendRequests();
        loadFriendsList();
    })
    .catch(error => {
        console.error('Error responding to friend request:', error);
        alert(error.message);
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
    window.countdownActive = false; // Reset the countdown active flag
    
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
                finalWpm: typingSpeed,
                finalAccuracy: accuracy,
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
    
    fetch('/api/updateBestWpm', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            mode: 'practice',
            wordCount: currentWordCount,
            wpm: typingSpeed
        })
    })
    .then(response => {
        if (!response.ok) {
            console.error('Failed to update best WPM');
        } else {
            console.log('Best WPM updated successfully');
        }
    })
    .catch(error => {
        console.error('Error updating best WPM:', error);
    });

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
    
    // Hide back button on results screen
    const practiceBackBtn = document.getElementById('practice-back-btn');
    if (practiceBackBtn) practiceBackBtn.style.display = 'none';
}

//Prac Mode Only
function restartTest() {
    const practiceResults = document.getElementById('practice-results');
    const practiceContainer = document.getElementById('practice-container');
    const keyboard = document.getElementById('keyboard');
    
    practiceResults.style.display = 'none';
    practiceContainer.style.display = 'block';
    keyboard.style.display = 'block';
    
    // Show back button again when restarting
    const practiceBackBtn = document.getElementById('practice-back-btn');
    if (practiceBackBtn) practiceBackBtn.style.display = 'block';
    
    // Scroll back to top
    practiceContainer.scrollTop = 0;
    
    resetTypingVariables();
    displayRandomWords(getPracticeWords(currentWordCount));
}

// PvP-specific end race function
function handlePlayerFinish() {
    console.log('handlePlayerFinish called - player won!');
    calculateStats();

    // Update best PvP WPM
    fetch('/api/updateBestWpm', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            mode: 'pvp',
            wordCount: 25,
            wpm: typingSpeed
        })
    })
    .then(response => {
        if (!response.ok) {
            console.error('Failed to update best PvP WPM');
        } else {
            console.log('Best PvP WPM updated successfully');
        }
    })
    .catch(error => {
        console.error('Error updating best PvP WPM:', error);
    });

    // Set the PvP race complete flag to prevent further key presses
    pvpRaceComplete = true;
    
    // Notify the server that this player has finished.
    // The server will then broadcast the 'raceOver' event to all players.
    console.log('Sending playerFinished event to server');
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

    // Calculate WPM, handle edge cases
    if (typingTime > 0 && correctWords >= 0) {
        typingSpeed = Math.floor((correctWords / typingTime) * 60000);
        // Ensure WPM is not NaN or Infinity
        if (isNaN(typingSpeed) || !isFinite(typingSpeed)) {
            typingSpeed = 0;
        }
    } else {
        typingSpeed = 0;
    }
    
    // Calculate accuracy, handle edge cases
    if (keysPressed > 0 && correctChars >= 0) {
        accuracy = Math.floor((correctChars / keysPressed) * 100);
        accuracy = Math.min(accuracy, 100); // Cap accuracy at 100%
    } else {
        accuracy = 0;
    }

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
    
    // Hide all PvP-related elements with animation
    resultsScreen.style.display = 'none';
    resultsScreen.style.position = '';
    resultsScreen.style.zIndex = '';
    
    // Hide match and pvpmenu
    if (match) {
    match.style.display = 'none';
    }
    if (pvpmenu) {
    pvpmenu.style.display = 'none';
    }

    const queueButton = document.getElementById('queueBtn');
    if (queueButton) {
        queueButton.removeEventListener('click', queueClickHandler);
    }
    
    // Only leave queue if we're actually in PvP mode
    const matchElement = document.getElementById('match');
    const pvpmenuElement = document.getElementById('pvpmenu');
    if (matchElement && matchElement.style.display !== 'none' || pvpmenuElement && pvpmenuElement.style.display !== 'none') {
        socket.emit('leaveQueue');
    }
    

    
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
    window.countdownActive = false;
    
    menu(); // Go back to main menu
}

// Initialize Socket.IO connection
const socket = io();



// Listen for queue count updates
socket.on('queueCountUpdate', (data) => {
    const queueCounter = document.getElementById('queue-counter');
    const pvpmenu = document.getElementById('pvpmenu');
    const match = document.getElementById('match');
    
    if (queueCounter) {
        queueCounter.textContent = `PLAYERS IN QUEUE: ${data.count}`;
        // Only show queue counter if PvP menu is visible AND match is not visible
        if (pvpmenu && pvpmenu.style.display !== 'none' && match && match.style.display === 'none') {
            queueCounter.style.display = 'block';
        } else {
            queueCounter.style.display = 'none';
        }
    }
});

// Function to setup PvP-specific socket event listeners
function setupPvPSocketEvents() {

    socket.on('raceOver', (data) => {
        // This event is now received by both the winner and the loser at the same time.
        pvpRaceComplete = true; // Stop typing for both players
        calculateStats();
        
        // Update best PvP WPM for both winner and loser
        fetch('/api/updateBestWpm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                mode: 'pvp',
                wordCount: 25,
                wpm: typingSpeed
            })
        })
        .then(response => {
            if (!response.ok) {
                console.error('Failed to update best PvP WPM');
            } else {
                console.log('Best PvP WPM updated successfully');
            }
        })
        .catch(error => {
            console.error('Error updating best PvP WPM:', error);
        });
        
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
                opponentProgressElement.textContent = `${data.correctWords}/25`;
                console.log('Updated opponent progress to:', data.correctWords);
            } else {
                console.log('Opponent progress element not found');
            }
        } else {
            console.log('No correctWords in opponent data');
            // Set to 0/25 as fallback
            if (opponentProgressElement) {
                opponentProgressElement.textContent = '0/25';
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
    const pvpMenu = document.getElementById('pvpmenu');
    const animationOverlay = document.getElementById('queue-animation-overlay');
    const match = document.getElementById('match');
    

    const oppLabel = document.querySelector('#oppTypingArea .typing-area-label');
    
    // Setup socket events for this match
    setupPvPSocketEvents();
    
    if (match) {
        // Hide the queue menu and show the match container
        if (animationOverlay) animationOverlay.classList.remove('active');
        // Hide PvP menu with animation
        pvpMenu.classList.remove('show');
        setTimeout(() => pvpMenu.style.display = 'none', 400);
        const queueBackBtn = document.getElementById('queueBackBtn');
        if (queueBackBtn) queueBackBtn.classList.remove('active');
        
        // Show match
        match.style.display = 'block';
        
        // Update opponent label with their name
        if (oppLabel) {
            oppLabel.innerHTML = `${data.opponent} <span id="opponent-progress">0/25</span>`;
        }
        const playerProgressElement = document.getElementById('player-progress');
        if (playerProgressElement) {
            playerProgressElement.textContent = '0/25';
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
        
        // Hide queue counter immediately when match starts
        const queueCounter = document.getElementById('queue-counter');
        if (queueCounter) {
            queueCounter.style.display = 'none';
        }
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

    // Hide menu
        menu.style.display = 'none';
        menuContent.style.display = 'none';
    
    // Show PvP menu
        pvpmenu.style.display = 'block';
        if (queueBackBtn) queueBackBtn.classList.add('active');
        
        // Show queue counter when PvP menu is shown
        const queueCounter = document.getElementById('queue-counter');
        if (queueCounter) {
            queueCounter.style.display = 'block';
        }
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
        
        // Hide PvP menu
        pvpmenu.style.display = 'none';
        if(queueBackBtn) queueBackBtn.classList.remove('active');
        
        // Hide queue counter immediately when going back
        const queueCounter = document.getElementById('queue-counter');
        if (queueCounter) {
            queueCounter.style.display = 'none';
        }
        
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

// Community button handler
const communityButton = document.getElementById('community');
if (communityButton && communityButton.tagName === 'BUTTON') {
    communityButton.addEventListener('click', function() {
        console.log('Community button clicked!');
        window.location.href = '/community';
    });
}

// Friends panel handlers
const friendsButton = document.getElementById('friends');
const friendsPanel = document.getElementById('friendsPanel');
const closeFriendsButton = document.getElementById('closeFriends');

if (friendsButton) {
    friendsButton.addEventListener('click', function() {
    friendsPanel.classList.add('open');
    loadFriendRequests();
    loadFriendsList();
    
    // No more auto-refresh - just load once when panel opens
});
}

// Friends tab functionality
const friendsTabs = document.querySelectorAll('.friends-tab');
friendsTabs.forEach(tab => {
    tab.addEventListener('click', function() {
        const targetTab = this.getAttribute('data-tab');
        
        // Remove active class from all tabs and content
        document.querySelectorAll('.friends-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.friends-tab-content').forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        this.classList.add('active');
        document.getElementById(targetTab + 'Tab').classList.add('active');
    });
});

if (closeFriendsButton) {
    closeFriendsButton.addEventListener('click', function() {
    friendsPanel.classList.remove('open');
    
    // No more auto-refresh to stop
});
}

// Friends search functionality
const friendsSearchInput = document.getElementById('friendsSearchInput');
const friendsSearchBtn = document.getElementById('friendsSearchBtn');
const friendsSearchResults = document.getElementById('friendsSearchResults');

if (friendsSearchInput) {
    friendsSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchFriends();
        }
    });
}

if (friendsSearchBtn) {
    friendsSearchBtn.addEventListener('click', searchFriends);
}

// Prevent spaces in search input
if (friendsSearchInput) {
    friendsSearchInput.addEventListener('keydown', (e) => {
        if (e.key === ' ') {
            e.preventDefault();
        }
    });
}

function searchFriends() {
    const searchTerm = friendsSearchInput.value.trim();
    
    if (!searchTerm) {
        friendsSearchResults.innerHTML = '<p style="text-align: center; color: #7f8c8d; font-style: italic;">Enter a username to search</p>';
        return;
    }

    friendsSearchResults.innerHTML = '<p style="text-align: center; color: #2c3e50;">Searching...</p>';

    fetch(`/api/userprofile/${searchTerm}`)
        .then(response => {
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('User not found');
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }
            return response.json();
        })
        .then(userData => {
            showFriendSearchResult(userData);
            // Clear the search input after successful search
            friendsSearchInput.value = '';
        })
        .catch(error => {
            console.error('Error searching user:', error);
            friendsSearchResults.innerHTML = '<p style="text-align: center; color: #e74c3c;">User not found</p>';
        });
}

function showFriendSearchResult(userData) {
    // Check if this is the current user
    fetch('/api/userprofile')
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Not logged in');
            }
        })
        .then(currentUserData => {
            const isCurrentUser = currentUserData.username === userData.username;
            const isAlreadyFriend = currentFriendsList.some(friend => friend.friendUsername === userData.username);
            
            friendsSearchResults.innerHTML = `
                <div class="friend-search-result">
                    <div class="friend-search-content" onclick="showProfilePopup('${userData.username}')">
                        <img src="${getProfilePictureUrl(userData.profilePicture)}" alt="Profile" class="friend-search-avatar" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2240%22 fill=%22%23bdc3c7%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 font-size=%2230%22 fill=%22%237f8c8d%22>👤</text></svg>'">
                        <div class="friend-search-info">
                            <div class="friend-search-name">${userData.username}</div>
                        </div>
                    </div>
                    ${isCurrentUser || isAlreadyFriend ? '' : `<button class="friend-add-btn" onclick="sendFriendRequest('${userData.username}')">Send Friend Request</button>`}
                </div>
            `;
        })
        .catch(error => {
            // If not logged in, show the button anyway
            friendsSearchResults.innerHTML = `
                <div class="friend-search-result">
                    <div class="friend-search-content" onclick="showProfilePopup('${userData.username}')">
                        <img src="${getProfilePictureUrl(userData.profilePicture)}" alt="Profile" class="friend-search-avatar" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2240%22 fill=%22%23bdc3c7%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 font-size=%2230%22 fill=%22%237f8c8d%22>👤</text></svg>'">
                        <div class="friend-search-info">
                            <div class="friend-search-name">${userData.username}</div>
                        </div>
                    </div>
                    <button class="friend-add-btn" onclick="addFriend('${userData.username}')">Add Friend</button>
                </div>
            `;
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

    // --- FIX: Define currentSpan here so it's always available in the function's scope ---
    let currentSpan;
    
    // If the test is complete, don't process any key presses
    if (!startTime) {
        startTime = new Date();
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
                // If the deleted character was correct, decrement the character count.
                if (prevSpan.classList.contains('matched')) {
                    correctChars--;
                }
                prevSpan.classList.remove("matched", "unmatched");
                const cursor = activeContainer.querySelector('.cursor');
                if (cursor && prevSpan.parentNode) {
                    prevSpan.parentNode.insertBefore(cursor, prevSpan);
                }
            }
        }
        // By removing the 'return' statement here, the code will now
        // fall through to the word recalculation logic at the end of the function.
    } else if (event.key.length === 1) { // Regular character press
        // Re-assign currentSpan here for a regular key press.
        currentSpan = activeContainer.querySelector(`#char-${keysPressed}`);
        if (!currentSpan) {
            return;
        }
        
        let currentLetter = currentSpan.textContent;
        if (currentLetter.charCodeAt(0) === 160) {
            currentLetter = ' ';
        }
        
        if (event.key === currentLetter) {
            currentSpan.classList.add("matched");
            colorKey('#4CAF50', event.key);
            correctChars++;
        } else {
            currentSpan.classList.add("unmatched");
            colorKey('#F44336', event.key);
        }

        keysPressed++;
    }

    // THIS IS THE SINGLE SOURCE OF TRUTH. IT NOW RUNS AFTER BACKSPACE.
    const words = activeContainer.querySelectorAll('.word');
    correctWords = 0;
    words.forEach(word => {
        const chars = word.querySelectorAll('.char:not(.space)');
        if (chars.length === 0) return;

        let allCharsMatched = true;
        chars.forEach(char => {
            if (!char.classList.contains('matched')) {
                allCharsMatched = false;
            }
        });
        
        if (allCharsMatched) {
            correctWords++;
        }
    });

    const nextSpan = activeContainer.querySelector(`#char-${keysPressed}`);
    const cursor = activeContainer.querySelector('.cursor');
    if (nextSpan && cursor && nextSpan.parentNode) {
        nextSpan.parentNode.insertBefore(cursor, nextSpan);
    }

    // Send current typing progress to opponent (only in PvP mode)
    if (pvpPlayerContainer && activeContainer === pvpPlayerContainer) {
        // This check now works safely even after a backspace, where currentSpan will be undefined.
        const wasCorrect = currentSpan && currentSpan.classList.contains('matched');
        
        // Update player's progress counter
        const playerProgressElement = document.getElementById('player-progress');
        if (playerProgressElement) {
            playerProgressElement.textContent = `${correctWords}/25`;
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
    if (isPvPMode && correctWords >= 25) {
        console.log('PvP win condition met! Correct words:', correctWords);
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
                // Mark as complete to stop typing
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

                // Don't stop the progress interval - let it continue until all players finish
                // The server will handle ending the match when all players are done
            } else {
                // This handles practice mode or a finished PvP match
                if (isPvPMode) {
                    handlePlayerFinish();
                } else {
                    endTest();
                }
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
        // Use final values for finished players, current values for active players
        const playerWpm = player[1].finished ? (player[1].finalWpm || player[1].wpm) : player[1].wpm;
        const playerAccuracy = player[1].finished ? (player[1].finalAccuracy || player[1].accuracy) : player[1].accuracy;
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
        
        // Hide menu
        menu.style.display = 'none';
        menuContent.style.display = 'none';
        
        // Show app
        app.style.display = 'block';
        wordSettings.style.display = 'block';
        practiceContainer.style.display = 'block';
        keyboard.style.display = 'block';
        
        // Hide PvP keyboards
        const playerKeyboard = document.getElementById('player-keyboard');
        const oppKeyboard = document.getElementById('opp-keyboard');
        if (playerKeyboard) playerKeyboard.style.display = 'none';
        if (oppKeyboard) oppKeyboard.style.display = 'none';
        
        // Hide profile div in practice mode
        const profileDiv = document.getElementById('profile');
        if (profileDiv) profileDiv.style.display = 'none';
        
        // Show back button in practice mode
        const practiceBackBtn = document.getElementById('practice-back-btn');
        if (practiceBackBtn) practiceBackBtn.style.display = 'block';
        
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
                console.log('Sending userData for:', data.user.username || data.user.displayName);
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
                    console.log('Accept button clicked for room:', data.privateRoomId);
                    if (!popup) return;
                    inRoom = true;
                    inviteQueue = [];
                    invitePopupOpen = false;

                    popup.classList.remove('show');
                    console.log('Sending acceptInvite event');
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
    console.log('Received redirectToRoom event for room:', roomId);
    window.location.href = `/privatematch.html?room=${roomId}&redirected=true`;
            
});

socket.on('leaderboardUpdate', (data) => {
    updateLeaderboard(data.playerStats);
});

const settingsButton = document.getElementById('settings');
const settingsPanel = document.getElementById('settingsPanel');
const closeSettingsButton = document.getElementById('closeSettings');
const profilePictureInput = document.getElementById('profilePictureInput');

if (settingsButton) {
    settingsButton.addEventListener('click', function() {
        // Load current user profile data
        fetch('/api/userprofile')
            .then(response => response.json())
            .then(data => {
                const aboutMeInput = document.getElementById('aboutMeInput');
                const charCount = document.querySelector('.char-count');
                
                if (aboutMeInput) {
                    aboutMeInput.value = data.aboutMe || '';
                }
                
                if (charCount) {
                    charCount.textContent = `${(data.aboutMe || '').length}/200`;
                }
            })
            .catch(error => {
                console.error('Error loading profile data:', error);
            });
        
        settingsPanel.style.display = 'block';
        setTimeout(() => {
            settingsPanel.classList.add('show');
        }, 10);
    });
}

if (closeSettingsButton) {
    closeSettingsButton.addEventListener('click', function() {
        // Save about me text when closing
        const aboutMeInput = document.getElementById('aboutMeInput');
        if (aboutMeInput) {
            const aboutMeText = aboutMeInput.value;
            
            fetch('/api/updatePlayerSettings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ aboutMe: aboutMeText })
            })
            .then(response => response.json())
            .then(data => {
                console.log('About me saved:', data.message);
                if (data.success) {
                    // Show success feedback (optional)
                    console.log('Settings updated successfully');
                }
            })
            .catch(error => {
                console.error('Error saving about me:', error);
                alert('Failed to save settings. Please try again.');
            });
        }
        
        settingsPanel.classList.remove('show');
        setTimeout(() => {
            settingsPanel.style.display = 'none';
        }, 300);
    });
}

// Logout functionality
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        // Log the logout action to the database and then logout
        fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            // Log the logout and then redirect to login page
            window.location.href = '/login';
        })
        .catch(error => {
            console.error('Error during logout:', error);
            // Still logout even if logging fails
            window.location.href = '/login';
        });
    });
}

// Character counter for about me
const aboutMeInput = document.getElementById('aboutMeInput');
const charCount = document.querySelector('.char-count');
if (aboutMeInput && charCount) {
    aboutMeInput.addEventListener('input', function() {
        const currentLength = this.value.length;
        charCount.textContent = `${currentLength}/200`;
    });
}

// Profile picture upload
if (profilePictureInput) {
    profilePictureInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('File size must be less than 5MB');
                return;
            }
            
            // Convert to base64
            const reader = new FileReader();
            reader.onload = function(e) {
                const base64Image = e.target.result;
                
                // Update profile picture in database
                fetch('/api/updatePlayerSettings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ profilePicture: base64Image })
                })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(err => {
                            throw new Error(err.error || 'Failed to update profile picture');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Profile picture updated:', data.message);
                    alert('Profile picture updated successfully!');
                })
                .catch(error => {
                    console.error('Error updating profile picture:', error);
                    alert(error.message);
                });
            };
            reader.readAsDataURL(file);
        }
    });
}



// Friends button functionality
};

document.addEventListener('DOMContentLoaded', () => {
    fetch('/auth/status')
        .then(res => res.json())
        .then(data => {
            if (data.authenticated && data.user) {
                const profileDiv = document.getElementById('profile');
                const usernameDiv = document.getElementById('username');
                
                if (usernameDiv && data.user.username) {
                    usernameDiv.textContent = data.user.username;
                }
                
                if (profileDiv) {
                    profileDiv.style.display = 'flex'; // Show the profile section
                }
                
                // Get the latest profile picture from the userprofile endpoint
                fetch('/api/userprofile')
                    .then(response => response.json())
                    .then(profileData => {
                        const profilePicDiv = document.getElementById('profile-picture');
                        if (profilePicDiv && profileData.profilePicture) {
                            if (profileData.profilePicture.startsWith('data:image/')) {
                                // Handle base64 data directly
                                profilePicDiv.style.backgroundImage = `url('${profileData.profilePicture}')`;
                            } else {
                                // Handle URL data with proxy
                                profilePicDiv.style.backgroundImage = `url('/proxy-image?url=${encodeURIComponent(profileData.profilePicture)}')`;
                            }
                        }
                    })
                    .catch(error => {
                        console.error('Error loading profile picture:', error);
                    });
            }
        });
});

// Helper function to get proper profile picture URL
function getProfilePictureUrl(profilePicture) {
    if (profilePicture && profilePicture.startsWith('data:image/')) {
        return profilePicture; // Return base64 data directly
    } else {
        return `/proxy-image?url=${encodeURIComponent(profilePicture || 'default-pic-url')}`; // Use proxy for URLs
    }
}


