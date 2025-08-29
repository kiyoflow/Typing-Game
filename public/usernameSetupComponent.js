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
                    background: #f0e8ca;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 3000;
                }

                .popup {
                    background: #ecdda5;
                    border: 3px solid #2c3e50;
                    border-radius: 15px;
                    padding: 40px;
                    text-align: center;
                    max-width: 450px;
                    width: 90%;
                    box-shadow: 0 10px 30px rgba(44, 62, 80, 0.2);
                }

                .title {
                    font-family: 'Kanit', sans-serif;
                    font-size: 2rem;
                    font-weight: bold;
                    color: #2c3e50;
                    margin-bottom: 15px;
                    letter-spacing: 2px;
                }

                .description {
                    font-family: 'Kanit', sans-serif;
                    font-size: 1.1rem;
                    color: #2c3e50;
                    margin-bottom: 30px;
                    line-height: 1.5;
                }

                .input-container {
                    margin-bottom: 30px;
                }

                .username-input {
                    width: 100%;
                    padding: 15px 20px;
                    font-family: 'Kanit', sans-serif;
                    font-size: 1.1rem;
                    font-weight: bold;
                    border: 2px solid #2c3e50;
                    border-radius: 10px;
                    background: #f0e8ca;
                    color: #2c3e50;
                    box-sizing: border-box;
                    transition: all 0.2s ease;
                    box-shadow: 0 3px 10px rgba(44, 62, 80, 0.1);
                }

                .username-input:focus {
                    outline: none;
                    background: #e5d590;
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(44, 62, 80, 0.2);
                }

                .error-message {
                    color: #e74c3c;
                    font-size: 1rem;
                    margin-top: 10px;
                    min-height: 24px;
                    font-family: 'Kanit', sans-serif;
                    font-weight: bold;
                }

                .submit-btn {
                    background: #f0e8ca;
                    color: #2c3e50;
                    border: 2px solid #2c3e50;
                    padding: 15px 35px;
                    font-family: 'Kanit', sans-serif;
                    font-size: 1.1rem;
                    font-weight: bold;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 3px 10px rgba(44, 62, 80, 0.1);
                }

                .submit-btn:hover:not(:disabled) {
                    background: #e5d590;
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(44, 62, 80, 0.2);
                }

                .submit-btn:disabled {
                    background: #d3d3d3;
                    color: #7f8c8d;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: 0 2px 5px rgba(44, 62, 80, 0.1);
                }

                .loading {
                    display: none;
                    margin-top: 15px;
                    font-family: 'Kanit', sans-serif;
                    font-weight: bold;
                    color: #2c3e50;
                    font-size: 1rem;
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