class PacManGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        
        // Game settings
        this.gridSize = 20;
        this.cols = Math.floor(this.canvas.width / this.gridSize);
        this.rows = Math.floor(this.canvas.height / this.gridSize);
        
        // PacMan properties
        this.pacman = {
            x: 1,
            y: 1,
            direction: 'right',
            mouthOpen: true
        };
        
        // Game state
        this.score = 0;
        this.dots = new Set();
        this.walls = new Set();
        
        // Animation timing
        this.lastTime = 0;
        this.moveSpeed = 200; // milliseconds between moves
        this.mouthSpeed = 150; // milliseconds between mouth animation
        this.lastMove = 0;
        this.lastMouth = 0;
        
        this.initializeLevel();
        this.setupControls();
        this.gameLoop();
    }
    
    initializeLevel() {
        // Create a simple maze with walls around the border and some internal walls
        for (let x = 0; x < this.cols; x++) {
            for (let y = 0; y < this.rows; y++) {
                // Border walls
                if (x === 0 || x === this.cols - 1 || y === 0 || y === this.rows - 1) {
                    this.walls.add(`${x},${y}`);
                }
                // Some internal walls for maze structure
                else if ((x % 4 === 0 && y % 4 === 0) || 
                         (x % 8 === 0 && y > 5 && y < this.rows - 5) ||
                         (y % 8 === 0 && x > 5 && x < this.cols - 5)) {
                    this.walls.add(`${x},${y}`);
                }
                // Add dots to empty spaces
                else {
                    this.dots.add(`${x},${y}`);
                }
            }
        }
        
        // Remove dot from PacMan's starting position
        this.dots.delete(`${this.pacman.x},${this.pacman.y}`);
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowUp':
                    this.pacman.direction = 'up';
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                    this.pacman.direction = 'down';
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                    this.pacman.direction = 'left';
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                    this.pacman.direction = 'right';
                    e.preventDefault();
                    break;
            }
        });
    }
    
    canMoveTo(x, y) {
        // Check boundaries and walls
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) {
            return false;
        }
        return !this.walls.has(`${x},${y}`);
    }
    
    movePacMan(currentTime) {
        if (currentTime - this.lastMove < this.moveSpeed) {
            return;
        }
        
        let newX = this.pacman.x;
        let newY = this.pacman.y;
        
        switch(this.pacman.direction) {
            case 'up':
                newY--;
                break;
            case 'down':
                newY++;
                break;
            case 'left':
                newX--;
                break;
            case 'right':
                newX++;
                break;
        }
        
        if (this.canMoveTo(newX, newY)) {
            this.pacman.x = newX;
            this.pacman.y = newY;
            this.lastMove = currentTime;
            
            // Check if PacMan ate a dot
            const dotKey = `${newX},${newY}`;
            if (this.dots.has(dotKey)) {
                this.dots.delete(dotKey);
                this.score += 10;
                this.scoreElement.textContent = this.score;
            }
        }
    }
    
    animateMouth(currentTime) {
        if (currentTime - this.lastMouth > this.mouthSpeed) {
            this.pacman.mouthOpen = !this.pacman.mouthOpen;
            this.lastMouth = currentTime;
        }
    }
    
    drawWalls() {
        this.ctx.fillStyle = '#0066ff';
        this.walls.forEach(wallKey => {
            const [x, y] = wallKey.split(',').map(Number);
            this.ctx.fillRect(
                x * this.gridSize,
                y * this.gridSize,
                this.gridSize,
                this.gridSize
            );
        });
    }
    
    drawDots() {
        this.ctx.fillStyle = '#ffff99';
        this.dots.forEach(dotKey => {
            const [x, y] = dotKey.split(',').map(Number);
            const centerX = x * this.gridSize + this.gridSize / 2;
            const centerY = y * this.gridSize + this.gridSize / 2;
            
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawPacMan() {
        const centerX = this.pacman.x * this.gridSize + this.gridSize / 2;
        const centerY = this.pacman.y * this.gridSize + this.gridSize / 2;
        const radius = this.gridSize / 2 - 2;
        
        // Set PacMan color to pink as required
        this.ctx.fillStyle = '#ff69b4';
        
        this.ctx.beginPath();
        
        if (this.pacman.mouthOpen) {
            // Calculate mouth angle based on direction
            let startAngle, endAngle;
            switch(this.pacman.direction) {
                case 'right':
                    startAngle = 0.2 * Math.PI;
                    endAngle = 1.8 * Math.PI;
                    break;
                case 'left':
                    startAngle = 1.2 * Math.PI;
                    endAngle = 0.8 * Math.PI;
                    break;
                case 'up':
                    startAngle = 1.7 * Math.PI;
                    endAngle = 1.3 * Math.PI;
                    break;
                case 'down':
                    startAngle = 0.7 * Math.PI;
                    endAngle = 0.3 * Math.PI;
                    break;
            }
            this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            this.ctx.lineTo(centerX, centerY);
        } else {
            // Closed mouth - full circle
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        }
        
        this.ctx.fill();
        
        // Draw eye
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        const eyeX = centerX + (this.pacman.direction === 'left' ? -radius/3 : radius/3);
        const eyeY = centerY - radius/3;
        this.ctx.arc(eyeX, eyeY, 2, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw game elements
        this.drawWalls();
        this.drawDots();
        this.drawPacMan();
        
        // Check win condition
        if (this.dots.size === 0) {
            this.ctx.fillStyle = '#ff69b4';
            this.ctx.font = '48px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('YOU WIN!', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    gameLoop(currentTime = 0) {
        this.movePacMan(currentTime);
        this.animateMouth(currentTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new PacManGame();
});