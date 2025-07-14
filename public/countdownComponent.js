class CountdownComponent extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div id="countdown-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 1001;
                transition: opacity 0.5s ease;
                opacity: 1;
            ">
                <div id="countdown-text" style="
                    font-size: 10rem;
                    color: white;
                    font-weight: bold;
                    text-shadow: 0 0 20px #fff, 0 0 40px #0ff;
                    text-align: center;
                    font-family: 'Ubuntu Mono', monospace;
                ">3</div>
            </div>
        `;
    }

    start(callback) {
        const overlay = this.querySelector('#countdown-overlay');
        const text = this.querySelector('#countdown-text');
        
        // Show and reset
        overlay.style.display = 'flex';
        overlay.style.opacity = '1';
        
        let count = 3;
        text.textContent = count;
        
        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                text.textContent = count;
            } else {
                text.textContent = 'GO!';
                setTimeout(() => {
                    overlay.style.opacity = '0';
                    setTimeout(() => {
                        overlay.style.display = 'none';
                        if (callback) callback();
                    }, 500);
                }, 500);
                clearInterval(countdownInterval);
            }
        }, 1000);
    }
}

customElements.define('countdown-component', CountdownComponent); 