// Mouse entity class
class Mouse {
    constructor(gameState, gifPlayers, canvas, ctx) {
        this.gameState = gameState;
        this.gifPlayers = gifPlayers;
        this.canvas = canvas;
        this.ctx = ctx;
    }

    update() {
        const mouse = this.gameState.mouse;
        
        // Apply gravity and movement
        mouse.velocity += mouse.gravity;
        mouse.y += mouse.velocity;
        
        // Smooth rotation based on velocity
        const targetRotation = Math.min(Math.max(mouse.velocity * 0.06, -0.3), 0.5);
        mouse.rotation += (targetRotation - mouse.rotation) * 0.12;
        
        // Check boundaries
        const groundY = this.canvas.height - this.gameState.config.game.groundHeight;
        if (mouse.y < -10 || mouse.y + mouse.height > groundY - 10) {
            // Trigger boundary collision callback for game over
            if (this.onBoundaryCollision) {
                this.onBoundaryCollision();
            }
            
            return; // Prevent further processing
        }

        // Handle eating timer
        if (mouse.isEating && !mouse.isDead) {
            mouse.eatTimer--;
            if (mouse.eatTimer <= 0) {
                mouse.isEating = false;
                this.gifPlayers.mouseEats.pause();
                this.gifPlayers.mouseEats.reset();
                this.gifPlayers.normal.play();
            }
        }
    }

    jump() {
        if (this.gameState.gameRunning) {
            this.gameState.mouse.velocity = this.gameState.mouse.jumpPower;
            return true; // Indicates successful jump for sound/particles
        }
        return false;
    }

    startEating() {
        const mouse = this.gameState.mouse;
        mouse.isEating = true;
        mouse.eatTimer = 45;
        
        // Control GIF animations
        this.gifPlayers.normal.pause();
        this.gifPlayers.mouseEats.play();
    }

    draw() {
        // Update GIF players
        Object.values(this.gifPlayers).forEach(player => player.update());

        const mouse = this.gameState.mouse;
        
        // Choose which GIF to display based on mouse state
        let currentPlayer;
        if (mouse.isDead) {
            currentPlayer = this.gifPlayers.dead;
            // Start death animation if not already started
            if (!mouse.deathAnimationPlayed) {
                this.gifPlayers.dead.play();
                mouse.deathAnimationPlayed = true;
            }
        } else if (mouse.isEating) {
            currentPlayer = this.gifPlayers.mouseEats;
        } else {
            currentPlayer = this.gifPlayers.normal;
        }
        
        let frame = currentPlayer.getCurrentFrame();

        if (frame && currentPlayer.isLoaded) {
            const x = Math.floor(mouse.x);
            const y = Math.floor(mouse.y);
            
            this.ctx.save();
            this.ctx.translate(x + mouse.width/2, y + mouse.height/2);
            
            // Don't rotate the mouse when dead
            if (!mouse.isDead) {
                this.ctx.rotate(mouse.rotation);
            }

            // Calculate aspect ratio and size
            const aspectRatio = frame.width / frame.height;
            let drawWidth = mouse.width;
            let drawHeight = drawWidth / aspectRatio;

            if (drawHeight > mouse.height) {
                drawHeight = mouse.height;
                drawWidth = drawHeight * aspectRatio;
            }
            
            this.ctx.drawImage(frame, -drawWidth/2, -drawHeight/2, drawWidth, drawHeight);
            this.ctx.restore();
        } else {
            // Fallback to drawn mouse
            this.drawFallback();
        }
    }

    drawFallback() {
        const mouse = this.gameState.mouse;
        const x = Math.floor(mouse.x);
        const y = Math.floor(mouse.y);
        
        this.ctx.save();
        this.ctx.translate(x + mouse.width/2, y + mouse.height/2);
        this.ctx.rotate(mouse.rotation);
        
        // Mouse body (wider, more horizontal oval like reference)
        this.ctx.fillStyle = '#8B7355';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, mouse.width/2.2, mouse.height/2.5, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Mouse head (wider and more prominent)
        this.ctx.fillStyle = '#9B8365';
        this.ctx.beginPath();
        this.ctx.ellipse(-mouse.width/3.5, -mouse.height/8, mouse.width/2.8, mouse.height/2.2, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Ears (positioned for wider head)
        this.ctx.fillStyle = '#8B7355';
        this.ctx.beginPath();
        this.ctx.arc(-mouse.width/2.5, -mouse.height/2, mouse.width/10, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(-mouse.width/4.5, -mouse.height/1.8, mouse.width/12, 0, Math.PI * 2);
        this.ctx.fill();

        // Inner ears (pink)
        this.ctx.fillStyle = '#D2691E';
        this.ctx.beginPath();
        this.ctx.arc(-mouse.width/2.5, -mouse.height/2, mouse.width/18, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(-mouse.width/4.5, -mouse.height/1.8, mouse.width/20, 0, Math.PI * 2);
        this.ctx.fill();

        // Eyes (positioned for wider face)
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(-mouse.width/2.2, -mouse.height/5, 4, 4);
        this.ctx.fillRect(-mouse.width/6, -mouse.height/5, 4, 4);

        // Nose (centered on wider snout)
        this.ctx.fillStyle = '#D2691E';
        this.ctx.fillRect(-mouse.width/1.8, -mouse.height/12, 4, 4);

        // Tail (longer and more curved for wider mouse)
        const tailWag = Math.sin(this.gameState.frameCount * 0.15) * 0.3;
        this.ctx.strokeStyle = '#8B7355';
        this.ctx.lineWidth = 5;
        this.ctx.beginPath();
        this.ctx.moveTo(mouse.width/2.2, mouse.height/6);
        this.ctx.bezierCurveTo(
            mouse.width/1.3 + tailWag * 12, mouse.height/3 + tailWag * 6,
            mouse.width/1.1 + tailWag * 18, -mouse.height/6 + tailWag * 10,
            mouse.width/0.7 + tailWag * 25, -mouse.height/3 + tailWag * 12
        );
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    // Get collision bounds (70% of actual size, centered)
    getCollisionBounds() {
        const mouse = this.gameState.mouse;
        const collisionWidth = mouse.width * 0.7;
        const collisionHeight = mouse.height * 0.7;
        
        return {
            x: mouse.x + (mouse.width - collisionWidth) / 2,
            y: mouse.y + (mouse.height - collisionHeight) / 2,
            width: collisionWidth,
            height: collisionHeight
        };
    }

    // Set boundary collision callback for death sound
    setBoundaryCollisionCallback(callback) {
        this.onBoundaryCollision = callback;
    }
} 