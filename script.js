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


function getRandomWords(count) {
    const selectedWords = [];
    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * words.length);
        selectedWords.push(words[randomIndex]);
    }
    return selectedWords;
}

// Define typingContainer as a global variable
let typingContainer;

function displayRandomWords(count = 25) {
    const randomWords = getRandomWords(count);
    typingContainer = document.getElementById("typing-container");

    let i = 0;
    let wrappedText2 = '';
    randomWords.forEach(function(word, index) {
        console.log(word);
        wrappedText2 += `<div class="word">`;
        word.split('').forEach(function(char, index) {
            wrappedText2 += `<span id="char-${i}" class="char">${char}</span>`;
            i++;
        });
        // Add a space span after each word except the last one
        if (index < randomWords.length - 1) {
            wrappedText2 += `<span id="char-${i}" class="char space"> </span>`;
            i++;
        }
        wrappedText2 += `</div>`;
    });

    
    typingContainer.innerHTML = wrappedText2;
}

window.onload = displayRandomWords;

let keysPressed = 0;
document.addEventListener('keydown', function(event) {
    console.log('Key pressed:', event.key);
    
    if (event.key === 'Backspace') {
        deleteLetter();
        return;
    }
    
    // Get the current letter each time a key is pressed
    const currentSpan = typingContainer.querySelector(`#char-${keysPressed}`);
    const currentLetter = currentSpan.textContent;
    
    console.log('Current letter:', currentLetter);
    
    // Check if the key pressed matches the current letter
    if (event.key === currentLetter) {
        console.log('Correct key pressed!');
        currentSpan.classList.add("matched");
        colorKey('green', event.key)
    } else {
        console.log('Incorrect key pressed!');
        currentSpan.classList.add("unmatched")
        colorKey('red', event.key)
    }

    keysPressed++;
});

document.addEventListener('keyup', function(event) {
    console.log('Key lifted:', event.key);
    colorKey('#ecdeaa', event.key)
});

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

function colorLetter(color){
    // Get the text content
    
    // Simply update the innerHTML with the first letter wrapped in a colored span
    typingContainer.innerHTML = `<span style="color: ${color};">${text[0]}</span>${text.substring(1)}`;
}

//backspace function
function deleteLetter() {
    if (keysPressed > 0) {
        const previousSpan = typingContainer.querySelector(`#char-${keysPressed - 1}`);
        if (previousSpan && previousSpan.classList.contains("unmatched")) {
            previousSpan.classList.remove("unmatched");
            keysPressed--;
        }
    }
}

//typing

let userTyped = '';

document.addEventListener('keydown', function(event) {
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

