/**
 * Stars Background logic (Vanilla JS implementation of the provided React component)
 */

(function() {
    const container = document.getElementById('starsBackground');
    if (!container) return;

    function generateStars(count, color) {
        const shadows = [];
        const radius = 2000;
        for (let i = 0; i < count; i++) {
            // Use polar coordinates to distribute on a disk
            const angle = Math.random() * Math.PI * 2;
            // Bias R towards center (0) for "higher concentration at the bottom"
            // Since the pivot is at the bottom of the screen
            const r = Math.pow(Math.random(), 2) * radius;
            
            const x = Math.floor(Math.cos(angle) * r);
            const y = Math.floor(Math.sin(angle) * r);
            shadows.push(`${x}px ${y}px ${color}`);
        }
        return shadows.join(', ');
    }

    function createStarLayer(count, size, duration, color) {
        const layer = document.createElement('div');
        layer.className = 'star-layer stars-moving';
        layer.style.animationDuration = `${duration}s`;
        
        const shadows = generateStars(count, color);
        
        const starDiv = document.createElement('div');
        starDiv.style.width = `${size}px`;
        starDiv.style.height = `${size}px`;
        starDiv.style.boxShadow = shadows;
        starDiv.style.position = 'absolute';
        starDiv.style.top = '50%';
        starDiv.style.left = '50%';
        starDiv.style.transform = 'translate(-50%, -50%)';

        layer.appendChild(starDiv);
        return layer;
    }

    const speed = 3600; // Extremely slow orbital drift (1 hour per rotation)
    const starColor = '#fff';

    const layer1 = createStarLayer(1000, 1, speed, starColor);
    const layer2 = createStarLayer(400, 2, speed * 2, starColor);
    const layer3 = createStarLayer(200, 3, speed * 3, starColor);

    const wrapper = document.createElement('div');
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';

    wrapper.appendChild(layer1);
    wrapper.appendChild(layer2);
    wrapper.appendChild(layer3);

    // Add multiple small twinkling layers for randomness
    for (let i = 0; i < 6; i++) {
        const twinkleLayer = createStarLayer(30, 1.5, speed * (1.5 + Math.random()), starColor);
        twinkleLayer.classList.add('stars-twinkle');
        twinkleLayer.style.setProperty('--twinkle-duration', `${0.8 + Math.random() * 1.5}s`);
        twinkleLayer.style.animationDelay = `${-Math.random() * 5}s`;
        wrapper.appendChild(twinkleLayer);
    }

    container.appendChild(wrapper);
})();
