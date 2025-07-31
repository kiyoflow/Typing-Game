class UsernameSetupComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                .overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 3000;
                }

                .popup {
                    background-color: #f0e8ca;
                    border: 3px solid #2c3e50;
                    border-radius: 20px;
                    padding: 30px;
                    text-align: center;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 20px 40px rgba(44, 62, 80, 0.3);
                }

                .title {
                    font-family: 'Ubuntu', Courier, monospace;
                    font-size: 24px;
                    font-weight: bold;
                    color: #2c3e50;
                    margin-bottom: 20px;
                }

                .description {
                    font-family: 'Ubuntu', Courier, monospace;
                    font-size: 16px;
                    color: #2c3e50;
                    margin-bottom: 25px;
                    line-height: 1.4;
                }

                .input-container {
                    margin-bottom: 25px;
                }

                .username-input {
                    width: 100%;
                    padding: 12px 15px;
                    font-family: 'Ubuntu', Courier, monospace;
                    font-size: 16px;
                    border: 2px solid #2c3e50;
                    border-radius: 8px;
                    background-color: #ecdda5;
                    color: #2c3e50;
                    box-sizing: border-box;
                }

                .username-input:focus {
                    outline: none;
                    border-color: #4CAF50;
                    box-shadow: 0 0 5px rgba(76, 175, 80, 0.3);
                }

                .error-message {
                    color: #e74c3c;
                    font-size: 14px;
                    margin-top: 8px;
                    min-height: 20px;
                    font-family: 'Ubuntu', Courier, monospace;
                }

                .submit-btn {
                    background-color: #4CAF50;
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    font-family: 'Ubuntu', Courier, monospace;
                    font-size: 16px;
                    font-weight: bold;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .submit-btn:hover {
                    background-color: #45a049;
                    transform: translateY(-2px);
                }

                .submit-btn:disabled {
                    background-color: #cccccc;
                    cursor: not-allowed;
                    transform: none;
                }

                .loading {
                    display: none;
                    margin-top: 10px;
                    font-family: 'Ubuntu', Courier, monospace;
                    color: #2c3e50;
                }
            </style>

            <div class="overlay">
                <div class="popup">
                    <div class="title">Choose Your Username</div>
                    <div class="description">
                        Welcome! Please choose a username to display in the game.
                    </div>
                    
                    <div class="input-container">
                        <input type="text" class="username-input" placeholder="Enter username..." maxlength="20">
                        <div class="error-message"></div>
                    </div>
                    
                    <button class="submit-btn">Continue</button>
                    <div class="loading">Setting up your account...</div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const input = this.shadowRoot.querySelector('.username-input');
        const submitBtn = this.shadowRoot.querySelector('.submit-btn');
        const errorMessage = this.shadowRoot.querySelector('.error-message');
        const loading = this.shadowRoot.querySelector('.loading');

        // Focus on input when component loads
        input.focus();

        // Handle input validation and real-time availability check
        input.addEventListener('input', async () => {
            const username = input.value.trim();
            const isValid = this.validateUsername(username);
            
            // Only check availability if username is valid and not empty
            if (isValid && username.length >= 3) {
                // Add a small delay to avoid too many requests
                clearTimeout(this.availabilityTimeout);
                this.availabilityTimeout = setTimeout(async () => {
                    const isAvailable = await this.checkUsernameAvailability(username);
                    if (isAvailable) {
                        errorMessage.textContent = 'Username is available!';
                        errorMessage.style.color = '#4CAF50';
                        submitBtn.disabled = false;
                    } else {
                        errorMessage.textContent = 'Username is already taken';
                        errorMessage.style.color = '#f44336';
                        submitBtn.disabled = true;
                    }
                }, 500); // 500ms delay
            } else if (username.length === 0) {
                errorMessage.textContent = '';
                submitBtn.disabled = true;
            }
        });

        // Handle Enter key
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitUsername();
            }
        });

        // Handle submit button
        submitBtn.addEventListener('click', () => {
            this.submitUsername();
        });
    }

    validateUsername(username) {
        const errorMessage = this.shadowRoot.querySelector('.error-message');
        const submitBtn = this.shadowRoot.querySelector('.submit-btn');

        // Check if empty
        if (!username.trim()) {
            errorMessage.textContent = 'Username cannot be empty';
            errorMessage.style.color = '#f44336';
            submitBtn.disabled = true;
            return false;
        }

        // Check for spaces
        if (username.includes(' ')) {
            errorMessage.textContent = 'Username cannot contain spaces';
            errorMessage.style.color = '#f44336';
            submitBtn.disabled = true;
            return false;
        }

        // Check length
        if (username.length < 3) {
            errorMessage.textContent = 'Username must be at least 3 characters';
            errorMessage.style.color = '#f44336';
            submitBtn.disabled = true;
            return false;
        }

        if (username.length > 20) {
            errorMessage.textContent = 'Username must be 20 characters or less';
            errorMessage.style.color = '#f44336';
            submitBtn.disabled = true;
            return false;
        }

        // Check for valid characters (letters, numbers, underscores only)
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            errorMessage.textContent = 'Username can only contain letters, numbers, and underscores';
            errorMessage.style.color = '#f44336';
            submitBtn.disabled = true;
            return false;
        }

        // Username format is valid (availability will be checked separately)
        return true;
    }

    async checkUsernameAvailability(username) {
        try {
            const response = await fetch('/api/checkUsername', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: username })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Username check failed:', errorData);
                return false;
            }

            const data = await response.json();
            return data.available;
        } catch (error) {
            console.error('Error checking username availability:', error);
            return false;
        }
    }

    async submitUsername() {
        const input = this.shadowRoot.querySelector('.username-input');
        const submitBtn = this.shadowRoot.querySelector('.submit-btn');
        const loading = this.shadowRoot.querySelector('.loading');
        const errorMessage = this.shadowRoot.querySelector('.error-message');

        const username = input.value.trim();

        if (!this.validateUsername(username)) {
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        loading.style.display = 'block';
        errorMessage.textContent = '';

        try {
            // First check if username is available
            const isAvailable = await this.checkUsernameAvailability(username);
            
            if (!isAvailable) {
                errorMessage.textContent = 'Username is already taken. Please choose another.';
                return;
            }

            // Username is available, now set it
            const response = await fetch('/api/setUsername', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: username })
            });

            if (response.ok) {
                // Success - redirect to main game page
                window.location.href = '/';
            } else {
                const data = await response.json();
                errorMessage.textContent = data.error || 'Failed to set username. Please try again.';
            }
        } catch (error) {
            errorMessage.textContent = 'Network error. Please try again.';
        } finally {
            // Hide loading state
            submitBtn.disabled = false;
            loading.style.display = 'none';
        }
    }
}

customElements.define('username-setup-component', UsernameSetupComponent); 