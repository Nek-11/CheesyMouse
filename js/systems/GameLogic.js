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

                    // Reduced particles for better performance
                    for (let j = 0; j < 5; j++) {
                        this.createParticle(
                            cheese.x,
                            cheese.y,
                            '255, 215, 0',
                            4,
                            15,
                            Math.random() * 3 + 1
                        );
                    }
                    
                    // Fewer sparkles
                    for (let j = 0; j < 3; j++) {
                        this.createParticle(
                            cheese.x,
                            cheese.y,
                            '255, 255, 255',
                            6,
                            20,
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
        // Optimized cheese placement - much faster!
        const groundY = 600 - this.gameState.config.game.groundHeight;
        const safeMargin = 20;
        const cheeseSize = 12;
        
        // Get the newest shelf (the one we just created)
        const newestShelf = this.gameState.wineShelves[this.gameState.wineShelves.length - 1];
        if (!newestShelf) return;
        
        // Smart placement strategy: use predefined safe zones instead of brute force
        const safeZones = this.calculateSafeZones(newestShelf, groundY, safeMargin, cheeseSize);
        
        if (safeZones.length > 0) {
            // Pick a random safe zone
            const zone = safeZones[Math.floor(Math.random() * safeZones.length)];
            
            // Random position within the chosen safe zone
            const randomX = zone.x + Math.random() * zone.width;
            const randomY = zone.y + Math.random() * zone.height;
            
            const cheese = {
                x: randomX,
                y: randomY,
                size: cheeseSize,
                collected: false
            };
            
            this.gameState.cheeses.push(cheese);
        }
    }
    
    calculateSafeZones(newestShelf, groundY, safeMargin, cheeseSize) {
        const zones = [];
        
        // Zone 1: In the gap of the newest shelf (always safe from newest shelf)
        const gapTop = newestShelf.topHeight + safeMargin + cheeseSize;
        const gapBottom = newestShelf.bottomY - safeMargin - cheeseSize;
        if (gapBottom > gapTop) {
            const gapZone = {
                x: newestShelf.x + newestShelf.width + 50,
                y: gapTop,
                width: 150,
                height: gapBottom - gapTop
            };
            
            // Check if this zone conflicts with other shelves
            if (this.isZoneSafe(gapZone, safeMargin, cheeseSize)) {
                zones.push(gapZone);
            }
        }
        
        // Zone 2: Above all shelves (if there's space)
        const topZoneBottom = this.findLowestTopShelf() - safeMargin - cheeseSize;
        if (topZoneBottom > safeMargin + cheeseSize) {
            const topZone = {
                x: 300,
                y: safeMargin + cheeseSize,
                width: 300,
                height: topZoneBottom - (safeMargin + cheeseSize)
            };
            
            if (this.isZoneSafe(topZone, safeMargin, cheeseSize)) {
                zones.push(topZone);
            }
        }
        
        // Zone 3: Below all shelves (if there's space)
        const bottomZoneTop = this.findHighestBottomShelf() + safeMargin + cheeseSize;
        const bottomZoneBottom = groundY - safeMargin - cheeseSize;
        if (bottomZoneBottom > bottomZoneTop) {
            const bottomZone = {
                x: 300,
                y: bottomZoneTop,
                width: 300,
                height: bottomZoneBottom - bottomZoneTop
            };
            
            if (this.isZoneSafe(bottomZone, safeMargin, cheeseSize)) {
                zones.push(bottomZone);
            }
        }
        
        return zones;
    }
    
    isZoneSafe(zone, safeMargin, cheeseSize) {
        // Check if zone overlaps with any existing shelf
        for (const shelf of this.gameState.wineShelves) {
            // Only check visible shelves
            if (shelf.x > -200 && shelf.x < 900) {
                const shelfLeft = shelf.x - safeMargin;
                const shelfRight = shelf.x + shelf.width + safeMargin;
                const zoneLeft = zone.x;
                const zoneRight = zone.x + zone.width;
                
                // Check horizontal overlap
                if (zoneRight > shelfLeft && zoneLeft < shelfRight) {
                    // Check vertical overlap with shelf solid parts
                    const zoneTop = zone.y;
                    const zoneBottom = zone.y + zone.height;
                    const topShelfBottom = shelf.topHeight + safeMargin;
                    const bottomShelfTop = shelf.bottomY - safeMargin;
                    
                    // Zone conflicts if it overlaps with top shelf or bottom shelf
                    if (zoneTop < topShelfBottom || zoneBottom > bottomShelfTop) {
                        return false; // Zone is not safe
                    }
                }
            }
        }
        return true; // Zone is safe
    }
    
    findLowestTopShelf() {
        let lowest = Infinity;
        for (const shelf of this.gameState.wineShelves) {
            if (shelf.x > -200 && shelf.x < 900) { // Only visible shelves
                lowest = Math.min(lowest, shelf.topHeight);
            }
        }
        return lowest === Infinity ? 0 : lowest;
    }
    
    findHighestBottomShelf() {
        let highest = 0;
        for (const shelf of this.gameState.wineShelves) {
            if (shelf.x > -200 && shelf.x < 900) { // Only visible shelves
                highest = Math.max(highest, shelf.bottomY);
            }
        }
        return highest;
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
        
        // Reduced jump particles for performance
        for (let i = 0; i < 4; i++) {
            this.createParticle(
                mouse.x + Math.random() * mouse.width,
                mouse.y + mouse.height,
                '255, 255, 255',
                4,
                15,
                Math.random() * 3 + 1
            );
        }
        
        // Fewer golden sparkles
        for (let i = 0; i < 2; i++) {
            this.createParticle(
                mouse.x + mouse.width/2,
                mouse.y + mouse.height/2,
                '255, 215, 0',
                2,
                20,
                2
            );
        }
    }
} 