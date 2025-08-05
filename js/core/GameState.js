// Centralized game state management
class GameState {
    constructor() {
        this.reset();
        this.highScore = 0;
        this.config = {
            mouse: {
                width: 80,
                height: 40,
                gravity: 0.42,
                jumpPower: -7.5,
                startX: 120,
                startY: 300
            },
            game: {
                initialSpeed: 2.2,
                maxSpeed: 6.5,
                speedAcceleration: 0.1,
                groundHeight: 100
            },
            difficulty: {
                baseSmallGap: 130,
                baseLargeGap: 170,
                minGap: 100,
                safeMargin: 30,
                gapReductionRate: 5, // pixels per 5 points
                gapReductionInterval: 5 // every N points
            }
        };
    }

    reset() {
        this.gameStarted = false;
        this.gameRunning = false;
        this.score = 0;
        this.gameSpeed = this.config?.game?.initialSpeed || 2.2;
        this.bottlesPassed = 0;
        this.frameCount = 0;
        this.groundOffset = 0;
        
        // Mouse state
        this.mouse = {
            x: this.config?.mouse?.startX || 120,
            y: this.config?.mouse?.startY || 300,
            width: this.config?.mouse?.width || 80,
            height: this.config?.mouse?.height || 40,
            velocity: 0,
            gravity: this.config?.mouse?.gravity || 0.42,
            jumpPower: this.config?.mouse?.jumpPower || -7.5,
            rotation: 0,
            isEating: false,
            eatTimer: 0,
            isDead: false,
            deathAnimationPlayed: false
        };

        // Game objects
        this.wineShelves = [];
        this.cheeses = [];
        this.particles = [];
        
        // Screen shake
        this.screenShake = 0;
        this.screenShakeDecay = 0.9;
    }

    startGame() {
        this.reset();
        this.gameStarted = true;
        this.gameRunning = true;
    }

    gameOver() {
        this.gameRunning = false;
        this.mouse.isDead = true;
        this.mouse.deathAnimationPlayed = false;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
        }
    }

    updateScore(points = 1) {
        this.score += points;
        return this.score;
    }

    addScreenShake(intensity) {
        this.screenShake = Math.max(this.screenShake, intensity);
    }

    updateScreenShake() {
        this.screenShake *= this.screenShakeDecay;
        if (this.screenShake < 0.1) this.screenShake = 0;
    }

    // Calculate progressive difficulty
    getCurrentGapSizes() {
        const { baseSmallGap, baseLargeGap, minGap, gapReductionRate, gapReductionInterval } = this.config.difficulty;
        
        const gapReduction = Math.min(
            Math.floor(this.score / gapReductionInterval) * gapReductionRate, 
            baseSmallGap - minGap
        );
        
        const smallGap = Math.max(baseSmallGap - gapReduction, minGap);
        const largeGap = Math.max(baseLargeGap - gapReduction, minGap + 20);
        
        return { smallGap, largeGap, gapReduction };
    }

    updateGameSpeed() {
        if (this.gameSpeed < this.config.game.maxSpeed) {
            this.gameSpeed += this.config.game.speedAcceleration;
        }
    }
}

// Export singleton instance
const gameState = new GameState(); 