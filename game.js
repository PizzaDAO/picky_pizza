class PizzaDetective {
    constructor() {
        this.attempts = 0;
        this.score = 0;
        // ✅ Puzzle rule: every guess (and every target) is exactly 3 toppings.
        // This turns the game into a Mastermind-style deduction puzzle.
        this.REQUIRED_TOPPINGS_PER_GUESS = 3;
        this.toppings = [
            { name: 'pepperoni', image: 'images/pepperoni.png' },
            { name: 'mushrooms', image: 'images/mushrooms.png' },
            { name: 'olives', image: 'images/olives.png' },
            { name: 'peppers', image: 'images/peppers.png' },
            { name: 'onions', image: 'images/onions.png' },
            { name: 'cheese', image: 'images/cheese.png' },
            { name: 'sausage', image: 'images/sausage.png' },
            { name: 'bacon', image: 'images/bacon.png' },
            { name: 'sauce', image: 'images/sauce.png' }
        ];
        this.placedToppings = [];
        this.targetToppings = [];
        this.history = [];
        this.puzzleAttempts = 0; // Track attempts per puzzle
        // When a puzzle is solved, keep the solved pizza + feedback on screen
        // until the player starts the next puzzle (by clicking a topping or Clear).
        this.pendingNewPuzzle = false;
        
        // Track whether the current pizza has been submitted; if so, keep it visible until the next topping or Clear.
        this.hasSubmitted = false;

        this.initializeGame();
    }

    clearFeedback() {
        const feedbackElement = document.getElementById('feedback');
        feedbackElement.textContent = '';
        feedbackElement.className = 'feedback';
    }

    startNextPuzzle() {
        this.clearPizza();
        this.clearFeedback();
        this.pendingNewPuzzle = false;
        this.hasSubmitted = false;
        this.generateTargetToppings();
        this.updateUI();
    }

    initializeGame() {
        this.setupEventListeners();
        this.generateTargetToppings();
        this.updateUI();
    }

    setupEventListeners() {
        document.getElementById('submit-btn').addEventListener('click', () => this.checkSolution());
        document.getElementById('clear-btn').addEventListener('click', () => this.handleClearClick());
        document.getElementById('pizza').addEventListener('click', (e) => this.handlePizzaClick(e));
    }

    handleClearClick() {
        // Clear should also clear the feedback line.
        // If the previous puzzle was solved, Clear starts the next puzzle.
        if (this.pendingNewPuzzle) {
            this.startNextPuzzle();
            return;
        }

        this.clearPizza();
        this.clearFeedback();
        this.hasSubmitted = false;
    }

    generateTargetToppings() {
        // ✅ Target is exactly 3 toppings (matches REQUIRED_TOPPINGS_PER_GUESS)
        const numToppings = this.REQUIRED_TOPPINGS_PER_GUESS;
        
        // Randomly select toppings
        const availableToppings = [...this.toppings];
        this.targetToppings = [];
        
        for (let i = 0; i < numToppings; i++) {
            const randomIndex = Math.floor(Math.random() * availableToppings.length);
            this.targetToppings.push(availableToppings[randomIndex]);
            availableToppings.splice(randomIndex, 1);
        }

        // Update UI
        this.updateUI();
    }

    updateUI() {
        // Update attempts and score
        document.getElementById('attempts').textContent = this.puzzleAttempts;
        document.getElementById('score').textContent = this.score;

        // Update toppings grid
        const toppingsGrid = document.getElementById('toppings-grid');
        toppingsGrid.innerHTML = this.toppings.map(topping => `
            <div class="topping-item">
                <div class="topping" data-topping="${topping.name}">
                    <img src="${topping.image}" alt="${topping.name}">
                </div>
                <div class="topping-label">${topping.name}</div>
            </div>
        `).join('');

        // Add click listeners to toppings
        toppingsGrid.querySelectorAll('.topping').forEach(topping => {
            topping.addEventListener('click', () => this.handleToppingClick(topping));
        });
    }

    handleToppingClick(toppingElement) {
        // If the previous puzzle was solved, any new interaction starts the next puzzle.
        if (this.pendingNewPuzzle) this.startNextPuzzle();

        // After submitting, keep the pizza + feedback visible until the player starts a new guess
        // by clicking a topping (any topping) or Clear.
        if (this.hasSubmitted) {
            this.clearPizza();
            this.clearFeedback();
            this.hasSubmitted = false;
        } else {
            // Clear any non-submission feedback (e.g. 'only 3 topping types') on interaction.
            this.clearFeedback();
        }

        const toppingName = toppingElement.dataset.topping;
        const topping = this.toppings.find(t => t.name === toppingName);

        // ✅ Only allow up to 3 different topping *types* on the pizza at once.
        // Re-clicking an already-used topping is always allowed (and still sprays 3–5 copies).
        const existingTypes = new Set(this.placedToppings.map(t => t.name));
        if (!existingTypes.has(toppingName) && existingTypes.size >= this.REQUIRED_TOPPINGS_PER_GUESS) {
            this.showMessage(`You can only use ${this.REQUIRED_TOPPINGS_PER_GUESS} topping types per pizza.`, 'error');
            return;
        }

        // ✅ Keep the fun "spray" behavior: clicking a topping drops multiple copies.
        // The deduction rules are enforced at submit time (exactly 3 *unique* topping types),
        // so players are free to click toppings multiple times and stack visuals.
        const copies = toppingName === 'sauce'
            ? 1
            : (3 + Math.floor(Math.random() * 3)); // 3–5 copies
        
        const pizza = document.getElementById('pizza');
        const pizzaSize = pizza.offsetWidth;
        const toppingSize = toppingName === 'sauce' ? pizzaSize * 0.9 : 50; // Scale sauce relative to pizza size
        const pizzaRadius = pizzaSize / 2;
        const toppingRadius = toppingSize / 2;
        const padding = toppingName === 'sauce' ? 5 : 20; // Less padding for sauce
        
        // Function to check if a point is within the pizza circle
        const isWithinPizza = (x, y) => {
            const centerX = pizzaSize / 2;
            const centerY = pizzaSize / 2;
            const distance = Math.sqrt(
                Math.pow(x - centerX, 2) + 
                Math.pow(y - centerY, 2)
            );
            return distance <= pizzaRadius - toppingRadius - padding;
        };
        
        // Function to generate a valid position
        const generateValidPosition = () => {
            let x, y;
            do {
                x = Math.random() * pizzaSize;
                y = Math.random() * pizzaSize;
            } while (!isWithinPizza(x, y));
            return { x, y };
        };
        
        for (let i = 0; i < copies; i++) {
            // Create a new topping element
            const newTopping = document.createElement('div');
            newTopping.className = 'topping-placed';
            newTopping.dataset.topping = toppingName;

            // Create and add the image
            const img = document.createElement('img');
            img.src = topping.image;
            img.alt = toppingName;
            newTopping.appendChild(img);

            // Add to pizza
            pizza.appendChild(newTopping);

            // Generate valid position within the pizza circle
            const { x, y } = generateValidPosition();

            // Generate random rotation
            const rotation = Math.random() * 360;
            newTopping.style.setProperty('--rotation', `${rotation}deg`);

            // Set position
            newTopping.style.left = `${x}px`;
            newTopping.style.top = `${y}px`;

            // Store topping position
            this.placedToppings.push({
                name: toppingName,
                element: newTopping,
                position: { x, y }
            });
        }
    }

    handlePizzaClick(e) {
        const pizza = document.getElementById('pizza');
        const rect = pizza.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Update position of the last placed topping
        if (this.placedToppings.length > 0) {
            const lastTopping = this.placedToppings[this.placedToppings.length - 1];
            lastTopping.element.style.left = `${x}px`;
            lastTopping.element.style.top = `${y}px`;
            lastTopping.position = { x, y };
        }
    }

    clearPizza() {
        this.placedToppings.forEach(topping => topping.element.remove());
        this.placedToppings = [];
    }

    handleClearClick() {
        // Clearing should also dismiss the feedback line.
        // If a puzzle was just solved, Clear advances to the next puzzle.
        if (this.pendingNewPuzzle) {
            this.startNextPuzzle();
            return;
        }
        this.clearPizza();
        this.clearFeedback();
    }

    async checkSolution() {
        // If the last puzzle was solved, don't allow submitting again; start the next puzzle instead.
        if (this.pendingNewPuzzle) {
            this.showMessage('Pick a topping (or Clear) to start the next pizza!', 'error');
            return;
        }

        // Mark that this pizza was submitted so it stays on screen until the next topping or Clear.
        this.hasSubmitted = true;

        // Mark that this pizza was submitted so it stays on screen until the next topping or Clear.
        this.hasSubmitted = true;

        // Enforce EXACTLY 3 unique topping *types* per submission and don't count invalid pizzas as attempts
        const placedToppingNames = this.placedToppings.map(t => t.name);
        const uniquePlacedToppingNames = [...new Set(placedToppingNames)];
        if (uniquePlacedToppingNames.length !== this.REQUIRED_TOPPINGS_PER_GUESS) {
            if (uniquePlacedToppingNames.length === 0) {
                this.showMessage('Please add toppings to the pizza first!', 'error');
            } else {
                this.showMessage(`Please submit a pizza with exactly ${this.REQUIRED_TOPPINGS_PER_GUESS} topping types.`, 'error');
            }
            return;
        }

        // Increment attempts
        this.puzzleAttempts++;
        this.attempts++;

        // Count how many of the 3 guessed toppings are correct
        const correctCount = uniquePlacedToppingNames.filter(
            topping => this.targetToppings.some(t => t.name === topping)
        ).length;

        let feedback = '';
        let isCorrect = false;

        if (correctCount === 0) {
            feedback = 'None of these toppings are correct.';
        } else if (correctCount === 1) {
            feedback = 'Exactly 1 of these toppings is correct.';
        } else if (correctCount === 2) {
            feedback = 'Exactly 2 of these toppings are correct.';
        } else {
            // correctCount === 3
            feedback = `Perfect! All 3 toppings are correct! (Solved in ${this.puzzleAttempts} attempts)`;
            isCorrect = true;
            this.score += 100;
        }

        // Add to history (store the 3 unique toppings, not visual duplicates)
        this.history.unshift({
            toppings: [...uniquePlacedToppingNames],
            feedback: feedback,
            isCorrect: isCorrect,
            attempt: this.puzzleAttempts
        });

        if (isCorrect) {
            // Reset attempts after adding to history, but keep the solved pizza visible.
            this.puzzleAttempts = 0;
            this.pendingNewPuzzle = true;
        }
        
        // Update UI with new attempt count
        this.updateUI();
        
        // Update UI
        this.updateFeedback(feedback, isCorrect);
        this.updateHistory();
        // ✅ Keep toppings on the pizza after submission.
        // The feedback line stays until the player clicks a topping or clicks Clear.
    }

    formatToppingsList(toppings) {
        // Get unique toppings
        const uniqueToppings = [...new Set(toppings)];
        
        if (uniqueToppings.length === 1) return uniqueToppings[0];
        if (uniqueToppings.length === 2) return `${uniqueToppings[0]} or ${uniqueToppings[1]}`;
        return `${uniqueToppings.slice(0, -1).join(', ')}, or ${uniqueToppings[uniqueToppings.length - 1]}`;
    }

    formatHistoryToppingsList(toppings) {
        // Get unique toppings
        const uniqueToppings = [...new Set(toppings)];
        
        if (uniqueToppings.length === 1) return uniqueToppings[0];
        if (uniqueToppings.length === 2) return `${uniqueToppings[0]} and ${uniqueToppings[1]}`;
        return `${uniqueToppings.slice(0, -1).join(', ')}, and ${uniqueToppings[uniqueToppings.length - 1]}`;
    }

    updateFeedback(feedback, isCorrect) {
        const feedbackElement = document.getElementById('feedback');
        feedbackElement.textContent = feedback;
        feedbackElement.className = `feedback ${isCorrect ? 'positive' : 'negative'}`;
    }

    showMessage(message, type) {
        const feedbackElement = document.getElementById('feedback');
        feedbackElement.textContent = message;
        feedbackElement.className = `feedback ${type}`;
        
        setTimeout(() => {
            feedbackElement.textContent = '';
            feedbackElement.className = 'feedback';
        }, 3000);
    }

    updateHistory() {
        const historyElement = document.getElementById('history');
        historyElement.innerHTML = this.history.map(item => {
            // Get unique topping names
            const uniqueToppings = [...new Set(item.toppings)];
            return `
                <div class="history-item">
                    <strong>Attempt ${item.attempt}:</strong> ${this.formatHistoryToppingsList(uniqueToppings)}<br>
                    <strong>Customer:</strong> <span class="${item.isCorrect ? 'positive' : 'negative'}">${item.feedback}</span>
                </div>
            `;
        }).join('');
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new PizzaDetective();
}); 