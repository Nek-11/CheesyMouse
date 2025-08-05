// Asset loading and management system
class AssetLoader {
    constructor() {
        this.assets = {
            images: {},
            gifPlayers: {}
        };
        this.loadedCount = 0;
        this.totalAssets = 0;
        this.onComplete = null;
    }

    async loadAll(onComplete) {
        this.onComplete = onComplete;
        this.totalAssets = 8; // 5 images + 3 GIF players
        
        // Load static images
        await this.loadImages();
        
        // Load GIF animations
        await this.loadGIFPlayers();
    }

    async loadImages() {
        const imageConfig = [
            { key: 'background', src: 'images/background.png' },
            { key: 'shelfTop', src: 'images/bottle_top.png' },
            { key: 'shelfDown', src: 'images/bottle_down.png' },
            { key: 'cheese', src: 'images/cheese.png' },
            { key: 'bricks', src: 'images/bricks.png' }
        ];

        const promises = imageConfig.map(config => this.loadImage(config.key, config.src));
        await Promise.all(promises);
    }

    loadImage(key, src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.assets.images[key] = img;
                this.assetLoaded();
                resolve();
            };
            img.onerror = () => {
                console.warn(`Failed to load image: ${src}`);
                this.assets.images[key] = null;
                this.assetLoaded();
                resolve();
            };
            img.src = src;
        });
    }

    async loadGIFPlayers() {
        const gifConfig = [
            { key: 'normal', basePath: 'images/mouse', frameCount: 6 },
            { key: 'mouseEats', basePath: 'images/mouse-eats', frameCount: 5 },
            { key: 'dead', basePath: 'images/mouse-dead', frameCount: 6 }
        ];

        for (const config of gifConfig) {
            const player = new GIFPlayer(config.basePath, config.frameCount);
            
            if (config.key === 'dead') {
                player.loop = false; // Death animation doesn't loop
            }
            
            await player.loadFrames();
            this.assets.gifPlayers[config.key] = player;
            
            if (config.key === 'normal') {
                player.play(); // Start normal animation
            }
            
            this.assetLoaded();
        }
    }

    assetLoaded() {
        this.loadedCount++;
        console.log(`Asset loaded: ${this.loadedCount}/${this.totalAssets}`);
        
        if (this.loadedCount === this.totalAssets) {
            console.log('All assets loaded and ready!');
            if (this.onComplete) {
                this.onComplete();
            }
        }
    }

    getImage(key) {
        return this.assets.images[key];
    }

    getGIFPlayer(key) {
        return this.assets.gifPlayers[key];
    }

    getAllGIFPlayers() {
        return this.assets.gifPlayers;
    }

    isLoaded() {
        return this.loadedCount === this.totalAssets;
    }
} 