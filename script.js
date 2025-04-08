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
let totalChars;
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
        });
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
    

    
    // Reset any existing styling
    document.querySelectorAll('.matched, .unmatched').forEach(element => {
        element.classList.remove('matched', 'unmatched');
    });
    
    // Reset cursor position
    const cursor = typingContainer.querySelector('.cursor');
    const firstChar = typingContainer.querySelector('#char-0');
    if (cursor && firstChar && firstChar.parentNode) {
        firstChar.parentNode.insertBefore(cursor, firstChar);
    }
    
}
// end of test function
function endTest(){

    const endTime = new Date();


    /* typingTime = endTime - startTime;
    typingSpeed = Math.floor(( correctWords/ typingTime) * 60000);
    accuracy = Math.floor((correctChars / totalChars) * 100); */
    
    console.log("End test ran successfully!!!!!!!!!!!")
    
    // Set the test complete flag to prevent further key presses
    testComplete = true;
}



// Event listener for typing and backspace handling
document.addEventListener('keydown', function(event) {
    //console.log('Key pressed:', event.key);
    if (testComplete) {
        //event.preventDefault();
        return;
    }
    // If the test is complete, don't process any key presses
    
    
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
});

document.addEventListener('keyup', function(event) {
    //console.log('Key lifted:', event.key);
    
    // If the test is complete, don't process any key lifts except for color reset
    if (testComplete) {
        return;
    }
    
    colorKey('#ecdeaa', event.key)

    if (keysPressed === totalChars) {
        const wordElements = typingContainer.querySelectorAll('.word');
        const lastWord = wordElements[wordElements.length - 1];
        const lastWordLetters = lastWord.querySelectorAll('.char');
        
        let allMatched = true;
        lastWordLetters.forEach(letter => {
            if (!letter.classList.contains('matched')) {
                allMatched = false;
            }
        });
        
        if (allMatched) {
            
            endTest();
            console.log('Test ended! All letters in last word matched.');
        }
    }
    else if (keysPressed > totalChars){
        
        endTest();
        console.log('Test ended!');
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

// Event listener for tracking user input

document.addEventListener('keydown', function(event) {
    // If the test is complete, don't track any more input
    if (testComplete) {
        return;
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
})





// Initialize game and set up word count selection
window.onload = function() {
    displayRandomWords(25);  // Show initial 25 words
    
    // Set up word count selection listeners after DOM is loaded
    document.querySelectorAll('.word-count').forEach(element => {
        element.addEventListener('click', function() {
            const wordCount = parseInt(this.dataset.count);
            displayRandomWords(wordCount);
            keysPressed = 0;  // Reset counter when changing words
        });
    });
};

// Remove the standalone querySelectorAll code from here