/**
 * Stars Background logic (Vanilla JS implementation of the provided React component)
 */

(function() {
    const container = document.getElementById('starsBackground');
    if (!container) return;

    function generateStars(count, color) {
        const shadows = [];
        for (let i = 0; i < count; i++) {
            const x = Math.floor(Math.random() * 4000) - 2000;
            const y = Math.floor(Math.random() * 4000) - 2000;
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
        
        const starDivDuplicate = document.createElement('div');
        starDivDuplicate.style.width = `${size}px`;
        starDivDuplicate.style.height = `${size}px`;
        starDivDuplicate.style.boxShadow = shadows;
        starDivDuplicate.style.top = '2000px';

        layer.appendChild(starDiv);
        layer.appendChild(starDivDuplicate);
        return layer;
    }

    const speed = 240; // Extremely slow movement for maximum tranquility
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
