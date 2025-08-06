// Game logic and mechanics system
class GameLogic {
    constructor(gameState, mouse, assetLoader) {
        this.gameState = gameState;
        this.mouse = mouse;
        this.assetLoader = assetLoader;
    }

    update() {
        this.updateWineShelves();
        this.updateCheeses();
        
        // Create new wine shelves
        if (this.gameState.wineShelves.length === 0 || 
            this.gameState.wineShelves[this.gameState.wineShelves.length - 1].x < 800 - 320) {
            this.createWineShelf();
        }

        // Update game speed every 5 cheese collected
        if (this.gameState.score > 0 && this.gameState.score % 5 === 0) {
            const expectedSpeed = this.gameState.config.game.initialSpeed + (Math.floor(this.gameState.score / 5) * 0.5);
            if (this.gameState.gameSpeed < expectedSpeed && this.gameState.gameSpeed < this.gameState.config.game.maxSpeed) {
                this.gameState.gameSpeed = Math.min(expectedSpeed, this.gameState.config.game.maxSpeed);
            }
        }
    }

    updateWineShelves() {
        for (let i = this.gameState.wineShelves.length - 1; i >= 0; i--) {
            const shelf = this.gameState.wineShelves[i];
            shelf.x -= this.gameState.gameSpeed;
            
            // Check if mouse passed the shelf
            if (!shelf.passed && shelf.x + shelf.width < this.gameState.mouse.x) {
                shelf.passed = true;
                this.gameState.bottlesPassed++;
                
                // Passing particles
                for (let j = 0; j < 8; j++) {
                    this.createParticle(
                        shelf.x + shelf.width,
                        shelf.topHeight + (shelf.bottomY - shelf.topHeight) / 2,
                        '255, 215, 0', 5, 35
                    );
                }
            }
            
            // Collision detection
            this.checkShelfCollision(shelf);
            
            // Remove off-screen shelves
            if (shelf.x + shelf.width < 0) {
                this.gameState.wineShelves.splice(i, 1);
            }
        }
    }

    checkShelfCollision(shelf) {
        const mouseBounds = this.mouse.getCollisionBounds();
        
        // Check collision with actual visual shelf bounds
        if ((mouseBounds.x + mouseBounds.width > shelf.x && mouseBounds.x < shelf.x + shelf.width) &&
            ((mouseBounds.y < shelf.topHeight) || // Top shelf collision: from 0 to shelf.topHeight
             (mouseBounds.y + mouseBounds.height > shelf.bottomY))) { // Bottom shelf collision: from shelf.bottomY to ground
            
            this.gameState.addScreenShake(12);
            
            // Trigger collision callback for game over
            if (this.onCollision) {
                this.onCollision();
            }
            
            return; // Prevent further processing like in original
        }
    }

    // Set collision callback for death sound
    setCollisionCallback(callback) {
        this.onCollision = callback;
    }

    // Set cheese collection callback for sound
    setCheeseCollectionCallback(callback) {
        this.onCheeseCollected = callback;
    }

    updateCheeses() {
        for (let i = this.gameState.cheeses.length - 1; i >= 0; i--) {
            const cheese = this.gameState.cheeses[i];
            cheese.x -= this.gameState.gameSpeed;
            
            // Check collision with mouse
            if (!cheese.collected) {
                const mouseBounds = this.mouse.getCollisionBounds();

                // Check if mouse collision area overlaps with cheese
                if (mouseBounds.x + mouseBounds.width > cheese.x - cheese.size &&
                    mouseBounds.x < cheese.x + cheese.size &&
                    mouseBounds.y + mouseBounds.height > cheese.y - cheese.size &&
                    mouseBounds.y < cheese.y + cheese.size) {
                
                    cheese.collected = true;
                    this.gameState.updateScore();
                    this.mouse.startEating();
                    
                    // Trigger cheese collection callback for sound
                    if (this.onCheeseCollected) {
                        this.onCheeseCollected();
                    }

                    // Cheese crunch particles
                    for (let j = 0; j < 10; j++) {
                        this.createParticle(
                            cheese.x,
                            cheese.y,
                            '255, 215, 0',
                            4,
                            20,
                            Math.random() * 3 + 1
                        );
                    }
                    
                    // Add sparkle particles
                    for (let j = 0; j < 8; j++) {
                        this.createParticle(
                            cheese.x,
                            cheese.y,
                            '255, 255, 255',
                            6,
                            35,
                            1
                        );
                    }
                }
            }
            
            // Remove off-screen cheese
            if (cheese.x < -cheese.size) {
                this.gameState.cheeses.splice(i, 1);
            }
        }
    }

    createWineShelf() {
        const groundY = 600 - this.gameState.config.game.groundHeight; // Canvas height is 600
        
        // Get current gap sizes based on difficulty progression
        const { smallGap, largeGap } = this.gameState.getCurrentGapSizes();
        const gapSize = Math.random() < 0.5 ? smallGap : largeGap;
        
        // VARIABLE GAP POSITIONING with safe margins
        const safeMargin = this.gameState.config.difficulty.safeMargin;
        const totalHeight = groundY - 80; // Total available height
        const minGapTop = safeMargin; // Minimum distance from top
        const maxGapTop = totalHeight - gapSize - safeMargin; // Maximum distance from top
        
        // Randomly position the gap vertically within safe bounds
        const gapTopPosition = minGapTop + Math.random() * (maxGapTop - minGapTop);
        
        const topShelfHeight = gapTopPosition;
        const bottomShelfStart = gapTopPosition + gapSize;
        const bottomShelfHeight = totalHeight - bottomShelfStart;
        
        const shelf = {
            x: 800, // Canvas width
            width: 90,
            topY: 0,
            topHeight: topShelfHeight,
            bottomY: bottomShelfStart,
            bottomHeight: bottomShelfHeight,
            passed: false
        };
        
        this.gameState.wineShelves.push(shelf);
        
        // Create cheese in random free spots
        this.createRandomCheese();
    }

    createRandomCheese() {
        // Calculate safe zones for cheese placement
        const groundY = 600 - this.gameState.config.game.groundHeight; // Canvas height - ground height
        const safeMargin = 20; // Distance from obstacles (shelves, top, bottom)
        const cheeseSize = 12;
        
        // Try to place cheese in random positions across the visible screen area
        const attempts = 15; // Maximum attempts to find a safe spot
        let cheeseCreated = false;
        
        for (let attempt = 0; attempt < attempts && !cheeseCreated; attempt++) {
            // Random X position in the visible screen area (where player can actually see/collect cheese)
            const randomX = 200 + Math.random() * 500; // Between x=200 and x=700
            
            // Random Y position in the playable area (avoiding ground and top margin)
            const minY = safeMargin + cheeseSize; // 20px from top
            const maxY = groundY - safeMargin - cheeseSize; // 20px from ground line
            const randomY = minY + Math.random() * (maxY - minY);
            
            // Check if this position conflicts with any existing wine shelves
            let isValidPosition = true;
            
            for (const shelf of this.gameState.wineShelves) {
                // Check if cheese bounding box overlaps with shelf horizontally (including safe margin)
                const cheeseLeft = randomX - cheeseSize;
                const cheeseRight = randomX + cheeseSize;
                const shelfLeft = shelf.x - safeMargin;
                const shelfRight = shelf.x + shelf.width + safeMargin;
                
                if (cheeseRight > shelfLeft && cheeseLeft < shelfRight) {
                    // Horizontally overlapping, now check vertical collision with solid parts
                    const cheeseTop = randomY - cheeseSize;
                    const cheeseBottom = randomY + cheeseSize;
                    
                    // Check collision with top shelf (from 0 to topHeight)
                    const topShelfBottom = shelf.topHeight + safeMargin;
                    const inTopShelf = cheeseTop < topShelfBottom;
                    
                    // Check collision with bottom shelf (from bottomY to ground)
                    const bottomShelfTop = shelf.bottomY - safeMargin;
                    const inBottomShelf = cheeseBottom > bottomShelfTop;
                    
                    if (inTopShelf || inBottomShelf) {
                        isValidPosition = false;
                        break;
                    }
                }
            }
            
            if (isValidPosition) {
                const cheese = {
                    x: randomX,
                    y: randomY,
                    size: cheeseSize,
                    collected: false
                };
                
                this.gameState.cheeses.push(cheese);
                cheeseCreated = true;
            }
        }
        
        // Fallback: if no safe random position found, try to place cheese in any gap that's visible on screen
        if (!cheeseCreated) {
            for (const shelf of this.gameState.wineShelves) {
                // Only consider shelves that are visible or soon-to-be visible on screen
                if (shelf.x < 800 && shelf.x > -200) {
                    const gapMiddleY = shelf.topHeight + (shelf.bottomY - shelf.topHeight) / 2;
                    const gapCenterX = shelf.x + shelf.width / 2;
                    
                    // Make sure the gap center is within safe bounds
                    if (gapCenterX > 100 && gapCenterX < 700 && 
                        gapMiddleY > safeMargin + cheeseSize && 
                        gapMiddleY < groundY - safeMargin - cheeseSize) {
                        
                        const cheese = {
                            x: gapCenterX,
                            y: gapMiddleY,
                            size: cheeseSize,
                            collected: false
                        };
                        
                        this.gameState.cheeses.push(cheese);
                        cheeseCreated = true;
                        break;
                    }
                }
            }
        }
    }

    createParticle(x, y, color, velocity, life, size = null) {
        this.gameState.particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * velocity,
            vy: (Math.random() - 0.5) * velocity - Math.random() * 2, // Slight upward bias
            color: color,
            life: life,
            maxLife: life,
            size: size || (Math.random() * 4 + 2),
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2
        });
    }

    createJumpParticles() {
        const mouse = this.gameState.mouse;
        
        // Enhanced jump particles with sparkle effect
        for (let i = 0; i < 8; i++) {
            this.createParticle(
                mouse.x + Math.random() * mouse.width,
                mouse.y + mouse.height,
                '255, 255, 255',
                4,
                25,
                Math.random() * 3 + 1
            );
        }
        
        // Add some golden sparkles
        for (let i = 0; i < 3; i++) {
            this.createParticle(
                mouse.x + mouse.width/2,
                mouse.y + mouse.height/2,
                '255, 215, 0',
                2,
                30,
                2
            );
        }
    }
} 