class FinishAnimationComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isVisible = false;
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: none;
                    justify-content: center;
                    align-items: center;
                    background: rgba(44, 62, 80, 0.9);
                    z-index: 2000;
                }

                :host([visible]) {
                    display: flex;
                }

                .finish-container {
                    text-align: center;
                    animation: slideIn 0.8s ease-out;
                }

                .finish-text {
                    font-size: 4rem;
                    font-weight: bold;
                    color: #ffffff;
                    text-shadow: 0px 4px 8px rgba(0,0,0,0.5);
                    font-family: 'Ubuntu', Courier, monospace;
                    margin-bottom: 30px;
                    opacity: 0;
                    transform: translateY(50px);
                    animation: textSlideUp 1s ease-out 0.3s forwards;
                }

                .winner-text {
                    font-size: 3rem;
                    font-weight: bold;
                    color: #ffdd44;
                    text-shadow: 0px 4px 8px rgba(0,0,0,0.5);
                    font-family: 'Ubuntu', Courier, monospace;
                    opacity: 0;
                    transform: translateY(50px);
                    animation: textSlideUp 1s ease-out 0.8s forwards, glow 2s ease-in-out 1.5s infinite;
                }

                @keyframes slideIn {
                    0% {
                        opacity: 0;
                        transform: scale(0.8);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes textSlideUp {
                    0% {
                        opacity: 0;
                        transform: translateY(50px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0px);
                    }
                }

                @keyframes glow {
                    0%, 100% {
                        text-shadow: 0px 4px 8px rgba(0,0,0,0.5);
                    }
                    50% {
                        text-shadow: 0px 4px 8px rgba(0,0,0,0.5), 0px 0px 20px #ffdd44;
                    }
                }
            </style>
            
            <div class="finish-container">
                <div class="finish-text">RACE FINISHED!</div>
                <div class="winner-text">Well done!</div>
            </div>
        `;
    }

    show({ isWinner = false, opponentName = 'Opponent', duration = 4000 } = {}) {
        const finishText = this.shadowRoot.querySelector('.finish-text');
        const winnerText = this.shadowRoot.querySelector('.winner-text');
        
        // Update text content based on who won
        finishText.textContent = 'RACE FINISHED!';
        if (isWinner) {
            winnerText.textContent = '🏆 YOU WON! 🏆';
        } else {
            winnerText.textContent = `${opponentName} Won!`;
        }
        
        // Show the animation
        this.setAttribute('visible', '');
        this.isVisible = true;
        
        // Hide after specified duration
        setTimeout(() => {
            this.hide();
        }, duration);
    }

    hide() {
        this.removeAttribute('visible');
        this.isVisible = false;
    }

    // Getter for visibility state
    get visible() {
        return this.isVisible;
    }
}

// Register the custom element
customElements.define('finish-animation', FinishAnimationComponent); 