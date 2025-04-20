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
    
    menuContent.style.display = 'block';
    wordSettings.style.display = 'none';
    typingContainer.style.display = 'none';
    keyboard.style.display = 'none';
    

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
        word.split('').forEach(function(char, index) {
            if (i === 0) wrappedText2 += '<span class="cursor"></span>';
            wrappedText2 += `<span id="char-${i}" class="char">${char}</span>`;
            i++;
    });;
        if (index < randomWords.length - 1) {
            wrappedText2 += `<span id="char-${i}" class="char space"> </span>`;
            i++;
        }
        else{
            wrappedText2 += `<span id="char-${i}" class="char"></span>`;
            i++;
        }
        wrappedText2 += `</div>`;
    });

   /*  wrappedText2 += `<div class = "word">`;
    wrappedText2 += `<span id ="char-${i}"></span>`
    wrappedText2 += `</div>`; */
    
    typingContainer.innerHTML = wrappedText2;
    console.log(i)
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
    typingSpeed = Math.floor(( correctWords/ typingTime) * 60000);
    console.log(correctChars)
    console.log(totalChars)

    accuracy = Math.floor((correctChars / (totalChars - 1)) * 100);     
    
    // Reset all keyboard key colors
    document.querySelectorAll('[id]').forEach(element => {
        if (element.style.backgroundColor) {
            element.style.backgroundColor = '#ecdeaa';
        }
    });
    
    console.log("End test ran successfully!!!!!!!!!!!")
    
    // Set the test complete flag to prevent further key presses
    testComplete = true;

    document.getElementById('typing-container').style.display = 'none';

    const resultsScreen = document.getElementById('results-screen');
    const keyboard = document.getElementById('keyboard');
    keyboard.style.display = 'none';
    resultsScreen.style.display = 'block';

    // Display WPM and accuracy
    resultsScreen.innerHTML = `
        <h2>Results</h2>
        <div class="stats">
            <p>Words Per Minute: <span class="highlight">${typingSpeed}</span></p>
            <p>Accuracy: <span class="highlight">${accuracy}%</span></p>
        </div>
    `;
}



// Event listener for typing and backspace handling
document.addEventListener('keydown', function(event) {
    //console.log('Key pressed:', event.key);
    if (testComplete) {
        event.preventDefault();
        return;
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
    const currentLetter = currentSpan.textContent;
    
    //console.log('Current letter:', currentLetter);
    
    if (event.key === currentLetter) {
        //console.log('Correct key pressed!');
        currentSpan.classList.add("matched");
        colorKey('green', event.key);
        correctChars++; // Increment correctChars for accurate typing
    } else {
        //console.log('Incorrect key pressed!');
        currentSpan.classList.add("unmatched");
        colorKey('red', event.key);
    }

    keysPressed++;
    
    
    const nextSpan = typingContainer.querySelector(`#char-${keysPressed}`);
    const cursor = typingContainer.querySelector('.cursor');
    if (nextSpan && cursor && nextSpan.parentNode) {
        nextSpan.parentNode.insertBefore(cursor, nextSpan);
    }

    // Scroll handling: Keep the cursor visible
    if (cursor) {
        const containerRect = typingContainer.getBoundingClientRect();
        const cursorRect = cursor.getBoundingClientRect();

        // Check if the cursor is below the visible area of the container
        if (cursorRect.bottom + 70 > containerRect.bottom) {
            // Scroll down to bring the cursor into view
            typingContainer.scrollTop += cursorRect.bottom + 70 - containerRect.bottom + 10; // Add a small buffer (e.g., 10px)
        }
        // Optional: Check if the cursor moved above the visible area (e.g., due to backspace near the top)
        else if (cursorRect.top < containerRect.top) {
            // Scroll up to bring the cursor into view
            typingContainer.scrollTop -= containerRect.top - cursorRect.top + 10; // Add a small buffer
        }
    }
});

document.addEventListener('keyup', function(event) {
    //console.log('Key lifted:', event.key);
    
    // If the test is complete, don't process any key lifts except for color reset
    if (testComplete) {
        return;
    }
    
    colorKey('#ecdeaa', event.key)

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
    });;
        
        if (wordMatched) {
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
    });;
        
        if (lastWordMatched) {
            endTest();
            console.log('Test ended successfully - last word matched!');
        }
    }
});



// Function to manage keyboard key colors
function colorKey(color, keyId) {
    // Special handling for spacebar
    if (keyId === ' ') {
        const spacebarElement = document.getElementById('space');
        if (spacebarElement) {
            spacebarElement.style.backgroundColor = color;
        }
        return;
    }
    
    const keybutton = document.getElementById(keyId.toUpperCase())
    if (keybutton) {
        keybutton.style.backgroundColor = color;
    }


}   


// Function to handle letter deletion
function deleteLetter() {
    if (keysPressed > 0) {
        const previousSpan = typingContainer.querySelector(`#char-${keysPressed - 1}`);
        if (previousSpan && previousSpan.classList.contains("unmatched")) {
            previousSpan.classList.remove("unmatched");
            keysPressed--;
        }
    }
}



// Initialize game and set up word count selection
window.onload = function() {
    menu();

    document.querySelector('#practice').addEventListener('click', function() {
        const wordSettings = document.getElementById('word-settings');
        const typingContainer = document.getElementById('typing-container');
        const keyboard = document.getElementById('keyboard');
        const menuContent = document.getElementById('menu-content');
        displayRandomWords(25);

        menuContent.style.display = 'none';
        wordSettings.style.display = 'block';
        typingContainer.style.display = 'block';
        keyboard.style.display = 'block';
    })
    
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
            startTest();
            displayRandomWords(wordCount);
              // Call startTest to properly reset all variables
    });;
    });
};

// Remove the standalone querySelectorAll code from here
