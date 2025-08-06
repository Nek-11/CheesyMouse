// GIF frame loader and player utility
class GIFPlayer {
    constructor(basePath, frameCount) {
        this.basePath = basePath;
        this.frameCount = frameCount;
        this.frames = [];
        this.currentFrame = 0;
        this.frameRate = 10; // frames per second
        this.lastFrameTime = 0;
        this.isLoaded = false;
        this.isPlaying = false;
        this.loop = true;
    }

    async loadFrames() {
        const loadPromises = [];
        for (let i = 0; i < this.frameCount; i++) {
            const img = new Image();
            const promise = new Promise((resolve, reject) => {
                img.onload = () => resolve(img);
                img.onerror = () => {
                    // Create fallback frame
                    const canvas = document.createElement('canvas');
                    canvas.width = 64;
                    canvas.height = 32;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#8B7355';
                    ctx.fillRect(0, 0, 64, 32);
                    resolve(canvas);
                };
            });
            
            // Try different frame naming conventions
            img.src = `${this.basePath}_frame_${i.toString().padStart(3, '0')}.png`;
            loadPromises.push(promise);
        }

        try {
            this.frames = await Promise.all(loadPromises);
            this.isLoaded = true;
        } catch (error) {
            // Fallback to single image
            const img = new Image();
            img.onload = () => {
                this.frames = [img];
                this.frameCount = 1;
                this.isLoaded = true;
            };
            img.onerror = () => {
                // Ultimate fallback - create a simple canvas frame
                const canvas = document.createElement('canvas');
                canvas.width = 64;
                canvas.height = 32;
                const ctx = canvas.getContext('2d');
                this.drawFallbackMouse(ctx, 32, 16);
                this.frames = [canvas];
                this.frameCount = 1;
                this.isLoaded = true;
            };
            img.src = this.basePath + '.png';
        }
    }

    drawFallbackMouse(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);
        
        // Mouse body (wider, horizontal)
        ctx.fillStyle = '#8B7355';
        ctx.beginPath();
        ctx.ellipse(0, 0, 20, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Mouse head (wider and more prominent)
        ctx.fillStyle = '#9B8365';
        ctx.beginPath();
        ctx.ellipse(-12, -2, 14, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Ears
        ctx.fillStyle = '#8B7355';
        ctx.beginPath();
        ctx.arc(-18, -8, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-10, -7, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes (positioned for wider face)
        ctx.fillStyle = '#000';
        ctx.fillRect(-20, -4, 2, 2);
        ctx.fillRect(-8, -4, 2, 2);
        
        // Nose
        ctx.fillStyle = '#D2691E';
        ctx.fillRect(-22, -1, 2, 2);
        
        // Tail (longer and more curved)
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(18, 2);
        ctx.bezierCurveTo(25, 0, 32, -4, 38, -8);
        ctx.stroke();
        
        ctx.restore();
    }

    play() {
        this.isPlaying = true;
        this.currentFrame = 0;
    }

    pause() {
        this.isPlaying = false;
    }

    reset() {
        this.currentFrame = 0;
    }

    update() {
        if (!this.isPlaying || !this.isLoaded || this.frameCount <= 1) return;
        
        const now = Date.now();
        const frameInterval = 1000 / this.frameRate;
        
        if (now - this.lastFrameTime >= frameInterval) {
            this.currentFrame++;
            if (this.currentFrame >= this.frameCount) {
                if (this.loop) {
                    this.currentFrame = 0;
                } else {
                    this.currentFrame = this.frameCount - 1;
                    this.isPlaying = false;
                }
            }
            this.lastFrameTime = now;
        }
    }

    getCurrentFrame() {
        if (!this.isLoaded || this.frames.length === 0) return null;
        return this.frames[Math.min(this.currentFrame, this.frames.length - 1)];
    }
} 