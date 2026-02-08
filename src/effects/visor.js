/**
 * Visor/Damage effect system
 * Tuned for subtle readability-focused overlays.
 */

const visorState = {
    damageLevel: 0,
    maxCracks: 3,
    isLowHealth: false,
    crackElements: [],
    glowElement: null,
    frameElement: null
};

export function initVisor() {
    const container = document.createElement('div');
    container.id = 'visor-overlay';
    container.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 50;
        overflow: hidden;
    `;

    const frame = document.createElement('div');
    frame.id = 'visor-frame';
    frame.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        box-shadow:
            inset 0 0 70px 10px rgba(0, 0, 0, 0.34),
            inset 0 0 140px 26px rgba(0, 15, 32, 0.12);
        border-radius: 16px;
        pointer-events: none;
    `;
    container.appendChild(frame);
    visorState.frameElement = frame;

    const glow = document.createElement('div');
    glow.id = 'damage-glow';
    glow.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(
            ellipse at center,
            transparent 58%,
            rgba(255, 0, 0, 0) 72%,
            rgba(255, 0, 0, 0.2) 100%
        );
        opacity: 0;
        transition: opacity 0.24s ease-out;
        pointer-events: none;
    `;
    container.appendChild(glow);
    visorState.glowElement = glow;

    const crackContainer = document.createElement('div');
    crackContainer.id = 'crack-container';
    crackContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
    `;
    container.appendChild(crackContainer);

    const gameContainer = document.getElementById('gameContainer');
    if (gameContainer) {
        gameContainer.appendChild(container);
    }
}

export function onPlayerHit(damage, currentHealth) {
    flashDamageGlow();

    if (damage >= 7 && visorState.damageLevel < visorState.maxCracks) {
        addCrack();
    }

    if (currentHealth <= 25 && !visorState.isLowHealth) {
        enableLowHealthMode();
    }

    setTimeout(() => {
        fadeDamageGlow();
    }, 170);
}

function flashDamageGlow() {
    if (!visorState.glowElement) return;

    visorState.glowElement.style.background = `radial-gradient(
        ellipse at center,
        transparent 48%,
        rgba(255, 0, 0, 0.12) 66%,
        rgba(255, 0, 0, 0.3) 100%
    )`;
    visorState.glowElement.style.opacity = '1';
}

function fadeDamageGlow() {
    if (!visorState.glowElement) return;
    visorState.glowElement.style.opacity = '0';
}

function addCrack() {
    const container = document.getElementById('crack-container');
    if (!container) return;

    visorState.damageLevel++;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0.34;
    `;

    const originX = 28 + Math.random() * 44;
    const originY = 28 + Math.random() * 44;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const crackPath = generateCrackPath(originX, originY);

    path.setAttribute('d', crackPath);
    path.setAttribute('stroke', 'rgba(193, 214, 255, 0.62)');
    path.setAttribute('stroke-width', '1.3');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', `crack-glow-${visorState.damageLevel}`);

    const blur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    blur.setAttribute('stdDeviation', '0.7');
    blur.setAttribute('result', 'coloredBlur');

    const merge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
    const node1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    node1.setAttribute('in', 'coloredBlur');
    const node2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    node2.setAttribute('in', 'SourceGraphic');

    merge.appendChild(node1);
    merge.appendChild(node2);
    filter.appendChild(blur);
    filter.appendChild(merge);
    defs.appendChild(filter);

    svg.appendChild(defs);
    path.setAttribute('filter', `url(#crack-glow-${visorState.damageLevel})`);
    svg.appendChild(path);

    container.appendChild(svg);
    visorState.crackElements.push(svg);
}

function generateCrackPath(startX, startY) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    let path = `M ${startX * width / 100} ${startY * height / 100}`;

    const segments = 2 + Math.floor(Math.random() * 2);
    let currentX = startX * width / 100;
    let currentY = startY * height / 100;

    for (let i = 0; i < segments; i++) {
        const angle = Math.random() * Math.PI * 2;
        const length = 24 + Math.random() * 34;

        currentX += Math.cos(angle) * length;
        currentY += Math.sin(angle) * length;

        path += ` L ${currentX} ${currentY}`;

        if (Math.random() < 0.25) {
            const branchAngle = angle + (Math.random() - 0.5) * (Math.PI / 2);
            const branchLength = length * 0.45;
            const branchX = currentX + Math.cos(branchAngle) * branchLength;
            const branchY = currentY + Math.sin(branchAngle) * branchLength;
            path += ` M ${currentX} ${currentY} L ${branchX} ${branchY} M ${currentX} ${currentY}`;
        }
    }

    return path;
}

function enableLowHealthMode() {
    visorState.isLowHealth = true;

    if (!visorState.glowElement) return;

    let pulseDirection = 1;
    const pulseInterval = setInterval(() => {
        if (!visorState.isLowHealth) {
            clearInterval(pulseInterval);
            return;
        }

        const currentOpacity = parseFloat(visorState.glowElement.style.opacity) || 0;
        let newOpacity = currentOpacity + pulseDirection * 0.04;

        if (newOpacity >= 0.28) {
            newOpacity = 0.28;
            pulseDirection = -1;
        } else if (newOpacity <= 0.07) {
            newOpacity = 0.07;
            pulseDirection = 1;
        }

        visorState.glowElement.style.background = `radial-gradient(
            ellipse at center,
            transparent 36%,
            rgba(255, 0, 0, 0.16) 52%,
            rgba(255, 0, 0, 0.38) 100%
        )`;
        visorState.glowElement.style.opacity = newOpacity.toString();
    }, 110);
}

export function disableLowHealthMode() {
    visorState.isLowHealth = false;
    fadeDamageGlow();
}

export function resetVisor() {
    visorState.damageLevel = 0;
    visorState.isLowHealth = false;

    visorState.crackElements.forEach(el => el.remove());
    visorState.crackElements = [];

    fadeDamageGlow();
}

export function updateVisor(health) {
    if (health > 25 && visorState.isLowHealth) {
        disableLowHealthMode();
    }
}
