// Main game initialization and loop
class CheesyMouseGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        // UI elements
        this.scoreElement = document.getElementById('score');
        this.gameOverElement = document.getElementById('gameOver');
        this.finalScoreElement = document.getElementById('finalScore');
        this.restartBtn = document.getElementById('restartBtn');
        this.titleScreen = document.getElementById('titleScreen');
        this.startBtn = document.getElementById('startBtn');

        // Initialize systems
        this.assetLoader = new AssetLoader();
        this.audioContext = null;
        
        // Game entities (initialized after assets load)
        this.mouse = null;
        this.renderer = null;
        this.gameLogic = null;
    }

    async init() {
        // Load all assets
        await this.assetLoader.loadAll(() => {
            this.onAssetsLoaded();
        });
    }

    onAssetsLoaded() {
        // Initialize game entities with loaded assets
        this.mouse = new Mouse(
            gameState, 
            this.assetLoader.getAllGIFPlayers(), 
            this.canvas, 
            this.ctx
        );

        this.renderer = new GameRenderer(
            this.ctx, 
            this.canvas, 
            gameState, 
            this.assetLoader
        );

        this.gameLogic = new GameLogic(gameState, this.mouse, this.assetLoader);

        // Setup event listeners
        this.setupEventListeners();
        
        // Start game loop
        this.gameLoop();
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.initAudio();
                
                if (!gameState.gameStarted) {
                    this.startGame();
                } else {
                    this.handleJump();
                }
            }
        });

        // UI buttons
        this.startBtn.addEventListener('click', () => {
            this.initAudio();
            this.startGame();
        });

        this.restartBtn.addEventListener('click', () => {
            this.startGame();
        });
    }

    initAudio() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playSound(frequency, duration, type = 'square', volume = 0.1) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    handleJump() {
        if (this.mouse.jump()) {
            // Create jump particles
            this.gameLogic.createJumpParticles();
            this.playSound(520, 0.15, 'square', 0.12);
        }
    }

    startGame() {
        gameState.startGame();
        this.titleScreen.style.display = 'none';
        this.gameOverElement.style.display = 'none';
        this.scoreElement.textContent = '0';
        
        // Reset GIF animations
        const gifPlayers = this.assetLoader.getAllGIFPlayers();
        gifPlayers.normal.play();
        gifPlayers.mouseEats.pause();
        gifPlayers.mouseEats.reset();
        gifPlayers.dead.pause();
        gifPlayers.dead.reset();
        
        // Create initial obstacles
        this.gameLogic.createWineShelf();
    }

    gameOver() {
        gameState.gameOver();
        
        this.finalScoreElement.innerHTML = 
            `CHEESE COLLECTED: ${gameState.score}<br>HIGH SCORE: ${gameState.highScore}`;
        this.gameOverElement.style.display = 'block';
        
        // Game over sound sequence
        setTimeout(() => this.playSound(200, 0.3, 'sawtooth', 0.15), 0);
        setTimeout(() => this.playSound(150, 0.4, 'sawtooth', 0.12), 200);
        setTimeout(() => this.playSound(100, 0.5, 'sawtooth', 0.1), 500);
    }

    gameLoop() {
        gameState.frameCount++;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply screen shake
        this.ctx.save();
        this.renderer.applyScreenShake();
        
        // Render game
        this.renderer.render();
        
        if (gameState.gameRunning) {
            // Update game logic
            this.mouse.update();
            this.gameLogic.update();
            
            // Update score display
            this.scoreElement.textContent = gameState.score;
            
            // Check for game over
            if (gameState.mouse.isDead && gameState.gameRunning) {
                this.gameOver();
            }
        } else if (!gameState.gameStarted) {
            // Draw mouse on title screen
            this.mouse.draw();
        }
        
        // Always draw the mouse if game is running or started
        if (gameState.gameRunning || gameState.gameStarted) {
            this.mouse.draw();
        }
        
        // Update screen shake
        gameState.updateScreenShake();
        
        this.ctx.restore();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize and start the game
document.addEventListener('DOMContentLoaded', () => {
    const game = new CheesyMouseGame();
    game.init();
}); 