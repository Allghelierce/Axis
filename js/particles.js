// ── PARTICLE ARC ANIMATION ──────────────────────────────
const _particles = [];
let _rafId = null;
let _canvas = null;
let _ctx = null;

// Sun: dim yellow
const SUN_COLOR  = { tail: [180, 160, 80], head: [210, 190, 100] };
// Moon: white silver
const MOON_COLOR = { tail: [180, 180, 190], head: [220, 220, 225] };

function _initCanvas() {
    if (_ctx) return true;
    _canvas = document.getElementById('flyCanvas');
    if (!_canvas) return false;
    _ctx = _canvas.getContext('2d');
    _canvas.width = window.innerWidth;
    _canvas.height = window.innerHeight;
    window.addEventListener('resize', () => {
        _canvas.width = window.innerWidth;
        _canvas.height = window.innerHeight;
    });
    return true;
}

function _easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function _bezierPoint(x1, y1, cpx, cpy, x2, y2, t) {
    const mt = 1 - t;
    return {
        x: mt * mt * x1 + 2 * mt * t * cpx + t * t * x2,
        y: mt * mt * y1 + 2 * mt * t * cpy + t * t * y2
    };
}

// Lerp between two RGB arrays
function _lerpColor(a, b, t) {
    return [
        Math.round(a[0] + (b[0] - a[0]) * t),
        Math.round(a[1] + (b[1] - a[1]) * t),
        Math.round(a[2] + (b[2] - a[2]) * t)
    ];
}

function _loop(timestamp) {
    if (!_ctx) return;
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

    for (let i = _particles.length - 1; i >= 0; i--) {
        const p = _particles[i];
        if (!p.start) p.start = timestamp;

        const elapsed = timestamp - p.start;
        const raw = Math.min(elapsed / p.duration, 1);
        const t = _easeInOutCubic(raw);
        const fadeOut = raw < 0.9 ? 1 : (1 - raw) * 10;

        // Draw fading trail with gradient from tail color → head color
        const trailSteps = 28;
        for (let s = 0; s <= trailSteps; s++) {
            const tTrail = Math.max(0, t - 0.32 * (1 - s / trailSteps));
            const pt = _bezierPoint(p.x1, p.y1, p.cpx, p.cpy, p.x2, p.y2, tTrail);
            const frac = s / trailSteps;
            const alpha = frac * frac * 0.45 * fadeOut;
            const radius = 0.8 + frac * 2.2;
            // frac=0 → tail color, frac=1 → head color
            const [r, g, b] = _lerpColor(p.colors.tail, p.colors.head, frac);
            _ctx.beginPath();
            _ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
            _ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
            _ctx.fill();
        }

        // Draw head dot in head color
        const head = _bezierPoint(p.x1, p.y1, p.cpx, p.cpy, p.x2, p.y2, t);
        const [hr, hg, hb] = p.colors.head;
        _ctx.beginPath();
        _ctx.arc(head.x, head.y, 3, 0, Math.PI * 2);
        _ctx.fillStyle = `rgba(${hr},${hg},${hb},${0.8 * fadeOut})`;
        _ctx.fill();

        if (raw >= 1) {
            _particles.splice(i, 1);
            if (p.toEl) {
                p.toEl.classList.remove('circle-arrive');
                void p.toEl.offsetWidth;
                p.toEl.classList.add('circle-arrive');
            }
            if (p.onArrive) p.onArrive();
        }
    }

    if (_particles.length > 0) {
        _rafId = requestAnimationFrame(_loop);
    } else {
        _rafId = null;
        _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
    }
}

function flyToCircle(toEl, colors, onArrive) {
    if (!_initCanvas() || !toEl) return;

    const toRect = toEl.getBoundingClientRect();
    const x2 = toRect.left + toRect.width / 2;
    const y2 = toRect.top + toRect.height / 2;

    const x1 = Math.random() * window.innerWidth;
    const y1 = -(20 + Math.random() * 60);

    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;

    const side = Math.random() < 0.5 ? 1 : -1;
    const arcStrength = 0.15 + Math.random() * 0.45;
    const arc = len * arcStrength * side;
    const midShift = 0.3 + Math.random() * 0.4;
    const mx = x1 + dx * midShift;
    const my = y1 + dy * midShift;
    const cpx = mx - (dy / len) * arc;
    const cpy = my + (dx / len) * arc;

    const duration = 380 + Math.random() * 160;

    _particles.push({ x1, y1, x2, y2, cpx, cpy, toEl, colors, duration, start: null, onArrive: onArrive || null });

    if (!_rafId) {
        _rafId = requestAnimationFrame(_loop);
    }
}

let _audioCtx = null;

function _playChime(freq) {
    try {
        if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const ctx = _audioCtx;
        const play = () => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.82, ctx.currentTime + 0.22);
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.012);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.28);
        };
        if (ctx.state === 'suspended') {
            ctx.resume().then(play);
        } else {
            play();
        }
    } catch (e) {}
}

// Called from toggleTask / toggleGoal after state flip
// updateSidebars has already run, so the counter DOM shows the new value.
// We revert to old, then let each particle update on arrival.
function onItemChecked(itemEl, type) {
    const circle = document.getElementById(type === 'task' ? 'taskSidebarCircle' : 'goalSidebarCircle');
    const countEl = document.getElementById(type === 'task' ? 'taskCircleCount' : 'goalCircleCount');
    const colors = type === 'task' ? SUN_COLOR : MOON_COLOR;

    if (!circle || !countEl) return;

    const newVal = parseInt(countEl.textContent) || 0;
    countEl.textContent = Math.max(0, newVal - 1);
    flyToCircle(circle, colors, () => { countEl.textContent = newVal; });

    _playChime(type === 'task' ? 620 : 780);
}
