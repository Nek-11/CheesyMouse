// Game rendering system
class GameRenderer {
    constructor(ctx, canvas, gameState, assetLoader) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.gameState = gameState;
        this.assetLoader = assetLoader;
    }

    render() {
        // Draw background and shelves FIRST
        this.drawStaticBackground();
        this.gameState.wineShelves.forEach(shelf => this.drawWineShelves(shelf));
        
        // Draw CHEESE, then GROUND for correct layering
        this.gameState.cheeses.forEach(cheese => this.drawCheese(cheese));
        this.drawMovingGround();
        
        this.updateParticles();
    }

    drawStaticBackground() {
        const backgroundImg = this.assetLoader.getImage('background');
        
        // Use the provided background image if loaded
        if (backgroundImg && backgroundImg.complete && backgroundImg.naturalWidth > 0) {
            // Draw a subtle colored background behind the image
            this.drawPixelGradient(0, 0, this.canvas.width, this.canvas.height - this.gameState.config.game.groundHeight, '#2a1810', '#1a100a');
            
            // Draw the background image with slight opacity so it doesn't overpower
            this.ctx.globalAlpha = 0.85;
            this.ctx.drawImage(backgroundImg, 0, 0, this.canvas.width, this.canvas.height - this.gameState.config.game.groundHeight);
            this.ctx.globalAlpha = 1.0;
            
            // Add a subtle overlay to maintain game atmosphere
            this.ctx.fillStyle = 'rgba(42, 24, 16, 0.15)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height - this.gameState.config.game.groundHeight);
        } else {
            // Fallback background while image loads
            this.drawPixelGradient(0, 0, this.canvas.width, this.canvas.height - this.gameState.config.game.groundHeight, '#2a1810', '#1a100a');
            
            // Simple stone texture fallback
            for (let y = 0; y < this.canvas.height - this.gameState.config.game.groundHeight; y += 32) {
                for (let x = 0; x < 100; x += 16) {
                    const shade = 0.7 + ((x + y) % 5) * 0.06;
                    this.drawPixelRect(x, y, 16, 16, `rgba(45, 27, 20, ${shade})`);
                }
                for (let x = this.canvas.width - 100; x < this.canvas.width; x += 16) {
                    const shade = 0.7 + ((x + y) % 5) * 0.06;
                    this.drawPixelRect(x, y, 16, 16, `rgba(45, 27, 20, ${shade})`);
                }
            }
        }
    }

    drawMovingGround() {
        const groundY = this.canvas.height - this.gameState.config.game.groundHeight;
        const bricksImg = this.assetLoader.getImage('bricks');
        
        // Update ground offset for scrolling
        if (this.gameState.gameRunning) {
            this.gameState.groundOffset = (this.gameState.groundOffset + this.gameState.gameSpeed) % 800;
        }
        
        // Draw black line above ground (5px thick)
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, groundY - 5, this.canvas.width, 5);
        
        // Use your custom bricks.png image if loaded
        if (bricksImg && bricksImg.complete && bricksImg.naturalWidth > 0) {
            // Draw your 800x95 bricks image, scrolling horizontally
            for (let x = -800; x < this.canvas.width + 800; x += 800) {
                const drawX = x - this.gameState.groundOffset;
                this.ctx.drawImage(bricksImg, drawX, groundY, 800, this.gameState.config.game.groundHeight);
            }
        } else {
            // Fallback to programmatic bricks if image fails to load
            this.drawPixelGradient(0, groundY, this.canvas.width, this.gameState.config.game.groundHeight, '#640000', '#3c0000');
            
            const brickHeight = 20;
            const brickWidth = 40;
            
            for (let x = -brickWidth; x < this.canvas.width + brickWidth; x += brickWidth) {
                const drawX = x - this.gameState.groundOffset;
                
                // Main brick (using R:100 base color)
                this.drawPixelRect(drawX, groundY, brickWidth - 2, brickHeight, '#640000');
                
                // Brick highlight (slightly lighter red)
                this.drawPixelRect(drawX, groundY, brickWidth - 2, 3, '#7d0000');
                
                // Brick shadow (darker red for depth)
                this.drawPixelRect(drawX, groundY + brickHeight - 3, brickWidth - 2, 3, '#4b0000');
                this.drawPixelRect(drawX + brickWidth - 4, groundY + 2, 2, brickHeight - 4, '#4b0000');
                
                // Mortar lines (very dark red/black)
                this.drawPixelRect(drawX + brickWidth - 2, groundY, 2, brickHeight, '#1e0000');
                
                // Optional: Add some texture variation
                if ((drawX + Math.floor(this.gameState.frameCount * 0.1)) % 80 < 40) {
                    // Subtle brick texture (mid-tone red)
                    this.drawPixelRect(drawX + 2, groundY + 2, 2, 2, '#550000');
                    this.drawPixelRect(drawX + brickWidth - 8, groundY + brickHeight - 6, 2, 2, '#4b0000');
                }
            }
            
            // Ground surface highlight (accent red line)
            this.drawPixelRect(0, groundY, this.canvas.width, 1, '#7d0000');
        }
        
        // Also draw black line above fallback ground
        if (!bricksImg || !bricksImg.complete || bricksImg.naturalWidth === 0) {
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, groundY - 5, this.canvas.width, 5);
        }
    }

    drawWineShelves(shelf) {
        const x = Math.floor(shelf.x);
        const shelfWidth = 90;
        const shelfTopImg = this.assetLoader.getImage('shelfTop');
        const shelfDownImg = this.assetLoader.getImage('shelfDown');

        if (shelfTopImg && shelfDownImg && shelfTopImg.complete && shelfDownImg.complete && shelfTopImg.naturalWidth > 0 && shelfDownImg.naturalWidth > 0) {
            // Calculate proper scale to fit game proportions
            const gameWidth = shelfWidth; // Target width for bottles in game
            const topScaleX = gameWidth / shelfTopImg.naturalWidth;
            const bottomScaleX = gameWidth / shelfDownImg.naturalWidth;
            
            // Scaled image heights (maintaining aspect ratio)
            const scaledTopHeight = shelfTopImg.naturalHeight * topScaleX;
            const scaledBottomHeight = shelfDownImg.naturalHeight * bottomScaleX;

            // Top Shelf
            if (shelf.topHeight > 0) {
                if (shelf.topHeight >= scaledTopHeight) {
                    // STRETCH - game height is bigger than image, stretch it
                    this.ctx.drawImage(shelfTopImg, x, 0, gameWidth, shelf.topHeight);
                } else {
                    // CUT - game height is smaller than image, crop from bottom of image
                    const cropRatio = shelf.topHeight / scaledTopHeight;
                    const cropHeight = shelfTopImg.naturalHeight * cropRatio;
                    const startY = shelfTopImg.naturalHeight - cropHeight; // Cut from top, show bottom
                    this.ctx.drawImage(
                        shelfTopImg,
                        0, startY, shelfTopImg.naturalWidth, cropHeight,
                        x, 0, gameWidth, shelf.topHeight
                    );
                }
            }

            // Bottom Shelf
            if (shelf.bottomHeight > 0) {
                const groundY = this.canvas.height - this.gameState.config.game.groundHeight;
                const actualBottomHeight = groundY - shelf.bottomY;
                if (actualBottomHeight >= scaledBottomHeight) {
                    // STRETCH - game height is bigger than image, stretch it
                    this.ctx.drawImage(shelfDownImg, x, shelf.bottomY, gameWidth, actualBottomHeight);
                } else {
                    // CUT - game height is smaller than image, crop from top of image
                    const cropRatio = actualBottomHeight / scaledBottomHeight;
                    const cropHeight = shelfDownImg.naturalHeight * cropRatio;
                    this.ctx.drawImage(
                        shelfDownImg,
                        0, 0, shelfDownImg.naturalWidth, cropHeight, // Cut from top, show top
                        x, shelf.bottomY, gameWidth, actualBottomHeight
                    );
                }
            }
        } else {
            // Fallback drawing
            if (shelf.topHeight > 0) {
                this.drawPixelGradient(x, shelf.topHeight - 20, shelfWidth, 20, '#8B4513', '#654321');
            }
            if (shelf.bottomHeight > 0) {
                this.drawPixelGradient(x, shelf.bottomY, shelfWidth, 20, '#8B4513', '#654321');
            }
        }
    }

    drawCheese(cheese) {
        if (!cheese.collected) {
            const x = Math.floor(cheese.x - cheese.size);
            const y = Math.floor(cheese.y - cheese.size);
            const cheeseImg = this.assetLoader.getImage('cheese');
            
            // Simple floating animation (much faster - no per-cheese calculations)
            const float = (this.gameState.frameCount % 60 < 30) ? 1 : -1;
            
            // Use the cheese.png image if available
            if (cheeseImg && cheeseImg.complete && cheeseImg.naturalWidth > 0) {
                this.ctx.drawImage(cheeseImg, x, y + float, cheese.size * 2, cheese.size * 2);
            } else {
                // Fallback cheese drawing
                this.ctx.fillStyle = '#FFD700';
                this.ctx.fillRect(x, y + float, cheese.size * 2, cheese.size * 2);
                this.ctx.fillStyle = '#FFA500';
                this.ctx.fillRect(x + 2, y + float + 2, cheese.size - 2, cheese.size - 2);
            }
        }
    }

    updateParticles() {
        for (let i = this.gameState.particles.length - 1; i >= 0; i--) {
            const particle = this.gameState.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.15; // gravity
            particle.vx *= 0.98; // air resistance
            particle.life--;
            
            if (particle.life <= 0) {
                this.gameState.particles.splice(i, 1);
            } else {
                // Much faster particle rendering - no save/restore/translate/rotate
                const alpha = (particle.life / particle.maxLife) * 0.8;
                this.ctx.fillStyle = `rgba(${particle.color}, ${alpha})`;
                this.ctx.fillRect(particle.x - particle.size/2, particle.y - particle.size/2, particle.size, particle.size);
            }
        }
    }

    applyScreenShake() {
        if (this.gameState.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.gameState.screenShake;
            const shakeY = (Math.random() - 0.5) * this.gameState.screenShake;
            this.ctx.translate(shakeX, shakeY);
        }
    }

    // Utility drawing functions
    drawPixelRect(x, y, width, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(Math.floor(x), Math.floor(y), width, height);
    }

    drawPixelGradient(x, y, width, height, colorTop, colorBottom) {
        const gradient = this.ctx.createLinearGradient(0, y, 0, y + height);
        gradient.addColorStop(0, colorTop);
        gradient.addColorStop(1, colorBottom);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(Math.floor(x), Math.floor(y), width, height);
    }
} 