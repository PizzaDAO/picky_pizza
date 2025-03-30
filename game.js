class PizzaDetective {
    constructor() {
        this.attempts = 0;
        this.score = 0;
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
        
        this.initializeGame();
    }

    initializeGame() {
        this.setupEventListeners();
        this.generateTargetToppings();
        this.updateUI();
    }

    setupEventListeners() {
        document.getElementById('submit-btn').addEventListener('click', () => this.checkSolution());
        document.getElementById('clear-btn').addEventListener('click', () => this.clearPizza());
        document.getElementById('pizza').addEventListener('click', (e) => this.handlePizzaClick(e));
    }

    generateTargetToppings() {
        // Generate a random number of toppings (3-5)
        const numToppings = Math.floor(Math.random() * 3) + 3;
        
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
        const toppingName = toppingElement.dataset.topping;
        const topping = this.toppings.find(t => t.name === toppingName);
        
        // Generate 3-5 toppings in random positions
        const numToppings = Math.floor(Math.random() * 3) + 3; // Random number between 3-5
        
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
        
        for (let i = 0; i < numToppings; i++) {
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

    async checkSolution() {
        // Don't count empty pizzas as attempts
        if (this.placedToppings.length === 0) {
            this.showMessage('Please add some toppings to the pizza first!', 'error');
            return;
        }

        // Increment attempts
        this.puzzleAttempts++;
        this.attempts++;
        
        // Get the names of placed toppings
        const placedToppingNames = this.placedToppings.map(t => t.name);
        
        // Check for extra toppings
        const extraToppings = placedToppingNames.filter(
            topping => !this.targetToppings.some(t => t.name === topping)
        );
        
        // Check for missing toppings
        const missingToppings = this.targetToppings.filter(
            topping => !placedToppingNames.includes(topping.name)
        );
        
        let feedback = '';
        let isCorrect = false;
        
        if (extraToppings.length === 0 && missingToppings.length === 0) {
            feedback = `Perfect! This is exactly what I wanted! (Solved in ${this.puzzleAttempts} attempts)`;
            isCorrect = true;
            this.score += 100;
            
            // Add to history before resetting attempts
            this.history.unshift({
                toppings: [...placedToppingNames],
                feedback: feedback,
                isCorrect: isCorrect,
                attempt: this.puzzleAttempts
            });
            
            // Reset attempts after adding to history
            this.puzzleAttempts = 0;
            this.generateTargetToppings();
        } else {
            if (extraToppings.length > 0) {
                feedback = `There's something on this pizza I don't like!`;
            } else if (missingToppings.length > 0) {
                feedback = `I'd like more toppings.`;
            }
            
            // Add to history for incorrect attempts
            this.history.unshift({
                toppings: [...placedToppingNames],
                feedback: feedback,
                isCorrect: isCorrect,
                attempt: this.puzzleAttempts
            });
        }
        
        // Update UI with new attempt count
        this.updateUI();
        
        // Update UI
        this.updateFeedback(feedback, isCorrect);
        this.updateHistory();
        this.clearPizza();
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