class MatchTimerComponent extends HTMLElement {
    constructor() {
        super();
        this.matchStartTime = null;
        this.matchTimer = null;
        this.matchDuration = 120; // 2 minutes in seconds
    }

    connectedCallback() {
        this.innerHTML = `
            <div id="match-timer" style="
                position: fixed;
                top: 50px;
                left: 20px;
                font-size: 28px;
                background: #ecdda5;
                color: #2c3e50;
                padding: 15px 20px;
                border-radius: 10px;
                border: 2px solid #2c3e50;
                font-family: 'Ubuntu Mono', monospace;
                font-weight: bold;
                box-shadow: 0 4px 12px rgba(44, 62, 80, 0.15);
                z-index: 1000;
                letter-spacing: 1px;
            ">2:00</div>
            
            <div id="times-up" style="
                display: none;
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: red;
                color: white;
                padding: 20px;
                font-size: 48px;
                border-radius: 10px;
                z-index: 9999;
            ">TIME'S UP!</div>
            
            <div id="final-results" style="
                display: none;
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 20px;
                border-radius: 10px;
                z-index: 9999;
                border: 2px solid #333;
            ">
                <h2>Final Rankings</h2>
                <div id="final-leaderboard"></div>
            </div>
        `;
    }

    startTimer() {
        this.matchStartTime = Date.now();
        let timeLeft = this.matchDuration;
        
        this.matchTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.matchStartTime) / 1000);
            timeLeft = this.matchDuration - elapsed;
            
            if (timeLeft <= 0) {
                timeLeft = 0;
                clearInterval(this.matchTimer);
                this.showTimeUp();
            }
            
            this.updateDisplay(timeLeft);
        }, 1000);
    }

    updateDisplay(timeLeft) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const timerDiv = this.querySelector('#match-timer');
        if (timerDiv) {
            timerDiv.textContent = display;
            
            // Change color as time runs out
            if (timeLeft <= 10) { // Last 10 seconds
                timerDiv.style.color = '#e74c3c';
                timerDiv.style.background = '#fadbd8';
            } else if (timeLeft <= 30) { // Last 30 seconds
                timerDiv.style.color = '#f39c12';
                timerDiv.style.background = '#fdeaa7';
            } else {
                timerDiv.style.color = '#2c3e50';
                timerDiv.style.background = '#ecdda5';
            }
        }
    }

    showTimeUp() {
        // Stop all typing immediately
        testComplete = true;
        pvpRaceComplete = true;
        
        // Reset all keyboard colors
        document.querySelectorAll('.key').forEach(key => {
            key.style.backgroundColor = '#ecdeaa';
        });
        
        // Clear any progress timers
        if (privateMatchProgressInterval) {
            clearInterval(privateMatchProgressInterval);
            privateMatchProgressInterval = null;
        }
        
        // Send final progress for private match
        socket.emit('privateMatchProgress', {
            progress: correctChars,
            totalChars: keysPressed,
            finished: true // Mark as finished due to time limit
        });
        
        // Show time's up message
        const timeUpDiv = this.querySelector('#times-up');
        if (timeUpDiv) {
            timeUpDiv.style.display = 'block';
            setTimeout(() => {
                timeUpDiv.style.display = 'none';
                // The server will emit matchEnded event when all players finish
                // No need to call showFinalLeaderboard here
            }, 3000);
        }
    }

    getElapsedTime() {
        return this.matchStartTime ? Date.now() - this.matchStartTime : 0;
    }

    hide() {
        this.style.display = 'none';
    }

    show() {
        this.style.display = 'block';
    }
}

customElements.define('match-timer-component', MatchTimerComponent);

// Global function to get elapsed time from any timer component
function getMatchElapsedTime() {
    const timer = document.querySelector('match-timer-component');
    return timer ? timer.getElapsedTime() : 0;
} 