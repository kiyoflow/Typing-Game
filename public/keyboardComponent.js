class Keyboard extends HTMLElement {
    connectedCallback() {
        // Get the keyboard-id attribute, default to "keyboard"
        const keyboardId = this.getAttribute('keyboard-id') || 'keyboard';
        
        this.innerHTML = `
        <div id="${keyboardId}" class="keyboard pvp-keyboard" style="display: none;">
                <div class="row">
                    <div class="key" id="Q">Q</div>
                    <div class="key" id="W">W</div>
                    <div class="key" id="E">E</div>
                    <div class="key" id="R">R</div>
                    <div class="key" id="T">T</div>
                    <div class="key" id="Y">Y</div>
                    <div class="key" id="U">U</div>
                    <div class="key" id="I">I</div>
                    <div class="key" id="O">O</div>
                    <div class="key" id="P">P</div>
                </div>
                <div class="row">
                    <div class="key" id="A">A</div>
                    <div class="key" id="S">S</div>
                    <div class="key" id="D">D</div>
                    <div class="key" id="F">F</div>
                    <div class="key" id="G">G</div>
                    <div class="key" id="H">H</div>
                    <div class="key" id="J">J</div>
                    <div class="key" id="K">K</div>
                    <div class="key" id="L">L</div>
                </div>
                <div class="row">
                    <div class="key" id="Z">Z</div>
                    <div class="key" id="X">X</div>
                    <div class="key" id="V">V</div>
                    <div class="key" id="B">B</div>
                    <div class="key" id="N">N</div>
                    <div class="key" id="M">M</div>
                </div>
                <div class="row">
                    <div class="key" id="space">Space</div>
            </div>
        </div>`
    }
}

customElements.define('keyboard-component', Keyboard);