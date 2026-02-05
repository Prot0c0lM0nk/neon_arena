/**
 * Visor/Damage effect system
 * Creates immersive helmet/visor effects for the player
 * 
 * INTENT: Provide visual feedback for player damage
 * INTENT: Create immersive "helmet HUD" aesthetic
 * INTENT: Communicate game state through visual effects
 * 
 * FEATURES:
 *   - Red glow around screen edges when damaged
 *   - Cracked glass overlay that accumulates with hits
 *   - Visor frame overlay (helmet interior feel)
 *   - Low health warning effects
 * 
 * NOTE: All effects are CSS-based overlays on top of the game canvas
 * NOTE: Effects fade over time to indicate recovery
 */

// Visor state
const visorState = {
    damageLevel: 0,      // 0-100, increases with each hit
    maxCracks: 5,        // Maximum crack layers
    isLowHealth: false,  // Track low health state
    crackElements: [],   // Array of crack overlay elements
    glowElement: null,   // Red glow element
    frameElement: null   // Visor frame element
};

/**
 * Initializes the visor system
 * Creates DOM elements for visor frame, cracks, and glow
 */
export function initVisor() {
    // Create visor container
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
    
    // Create visor frame (helmet interior feel)
    const frame = document.createElement('div');
    frame.id = 'visor-frame';
    frame.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        box-shadow: 
            inset 0 0 100px 20px rgba(0, 0, 0, 0.8),
            inset 0 0 200px 50px rgba(0, 20, 40, 0.3);
        border-radius: 20px;
        pointer-events: none;
    `;
    container.appendChild(frame);
    visorState.frameElement = frame;
    
    // Create damage glow overlay
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
            transparent 50%,
            rgba(255, 0, 0, 0) 70%,
            rgba(255, 0, 0, 0.3) 100%
        );
        opacity: 0;
        transition: opacity 0.3s ease-out;
        pointer-events: none;
    `;
    container.appendChild(glow);
    visorState.glowElement = glow;
    
    // Create crack container
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
    
    // Add to game container
    const gameContainer = document.getElementById('gameContainer');
    if (gameContainer) {
        gameContainer.appendChild(container);
    }
}

/**
 * Triggers damage effect when player is hit
 * @param {number} damage - Amount of damage taken
 * @param {number} currentHealth - Player's current health percentage (0-100)
 */
export function onPlayerHit(damage, currentHealth) {
    // Flash red glow
    flashDamageGlow();
    
    // Add crack if damage is significant
    if (damage >= 5 && visorState.damageLevel < visorState.maxCracks) {
        addCrack();
    }
    
    // Check for low health
    if (currentHealth <= 25 && !visorState.isLowHealth) {
        enableLowHealthMode();
    }
    
    // Fade glow out
    setTimeout(() => {
        fadeDamageGlow();
    }, 200);
}

/**
 * Flashes the red damage glow
 */
function flashDamageGlow() {
    if (!visorState.glowElement) return;
    
    visorState.glowElement.style.background = `radial-gradient(
        ellipse at center,
        transparent 40%,
        rgba(255, 0, 0, 0.2) 60%,
        rgba(255, 0, 0, 0.5) 100%
    )`;
    visorState.glowElement.style.opacity = '1';
}

/**
 * Fades the damage glow out
 */
function fadeDamageGlow() {
    if (!visorState.glowElement) return;
    visorState.glowElement.style.opacity = '0';
}

/**
 * Adds a crack to the visor
 * Each crack is a random SVG path
 */
function addCrack() {
    const container = document.getElementById('crack-container');
    if (!container) return;
    
    visorState.damageLevel++;
    
    // Create crack SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0.6;
    `;
    
    // Random position for crack origin
    const originX = 20 + Math.random() * 60; // 20-80% of screen
    const originY = 20 + Math.random() * 60;
    
    // Generate crack path
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const crackPath = generateCrackPath(originX, originY);
    
    path.setAttribute('d', crackPath);
    path.setAttribute('stroke', 'rgba(200, 220, 255, 0.8)');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    
    // Add filter for glow effect
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', `crack-glow-${visorState.damageLevel}`);
    
    const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    feGaussianBlur.setAttribute('stdDeviation', '1');
    feGaussianBlur.setAttribute('result', 'coloredBlur');
    
    const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
    const feMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    feMergeNode1.setAttribute('in', 'coloredBlur');
    const feMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    feMergeNode2.setAttribute('in', 'SourceGraphic');
    
    feMerge.appendChild(feMergeNode1);
    feMerge.appendChild(feMergeNode2);
    filter.appendChild(feGaussianBlur);
    filter.appendChild(feMerge);
    defs.appendChild(filter);
    
    svg.appendChild(defs);
    path.setAttribute('filter', `url(#crack-glow-${visorState.damageLevel})`);
    svg.appendChild(path);
    
    container.appendChild(svg);
    visorState.crackElements.push(svg);
}

/**
 * Generates a random crack path string
 * @param {number} startX - Starting X percentage
 * @param {number} startY - Starting Y percentage
 * @returns {string} SVG path data
 */
function generateCrackPath(startX, startY) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    let path = `M ${startX * width / 100} ${startY * height / 100}`;
    
    // Generate 3-5 segments
    const segments = 3 + Math.floor(Math.random() * 3);
    let currentX = startX * width / 100;
    let currentY = startY * height / 100;
    
    for (let i = 0; i < segments; i++) {
        // Random direction and length
        const angle = Math.random() * Math.PI * 2;
        const length = 30 + Math.random() * 50;
        
        currentX += Math.cos(angle) * length;
        currentY += Math.sin(angle) * length;
        
        path += ` L ${currentX} ${currentY}`;
        
        // 30% chance to branch
        if (Math.random() < 0.3) {
            const branchAngle = angle + (Math.random() - 0.5) * Math.PI / 2;
            const branchLength = length * 0.5;
            const branchX = currentX + Math.cos(branchAngle) * branchLength;
            const branchY = currentY + Math.sin(branchAngle) * branchLength;
            path += ` M ${currentX} ${currentY} L ${branchX} ${branchY} M ${currentX} ${currentY}`;
        }
    }
    
    return path;
}

/**
 * Enables low health warning mode
 * Pulsing red glow and intensified visor effects
 */
function enableLowHealthMode() {
    visorState.isLowHealth = true;
    
    if (!visorState.glowElement) return;
    
    // Start pulsing animation
    let pulseDirection = 1;
    const pulseInterval = setInterval(() => {
        if (!visorState.isLowHealth) {
            clearInterval(pulseInterval);
            return;
        }
        
        const currentOpacity = parseFloat(visorState.glowElement.style.opacity) || 0;
        let newOpacity = currentOpacity + (pulseDirection * 0.05);
        
        if (newOpacity >= 0.4) {
            newOpacity = 0.4;
            pulseDirection = -1;
        } else if (newOpacity <= 0.1) {
            newOpacity = 0.1;
            pulseDirection = 1;
        }
        
        visorState.glowElement.style.background = `radial-gradient(
            ellipse at center,
            transparent 30%,
            rgba(255, 0, 0, 0.3) 50%,
            rgba(255, 0, 0, 0.6) 100%
        )`;
        visorState.glowElement.style.opacity = newOpacity.toString();
    }, 100);
}

/**
 * Disables low health mode
 */
export function disableLowHealthMode() {
    visorState.isLowHealth = false;
    fadeDamageGlow();
}

/**
 * Resets all visor effects
 * Called when game restarts
 */
export function resetVisor() {
    visorState.damageLevel = 0;
    visorState.isLowHealth = false;
    
    // Remove all cracks
    visorState.crackElements.forEach(el => el.remove());
    visorState.crackElements = [];
    
    // Reset glow
    fadeDamageGlow();
}

/**
 * Updates visor based on current health
 * @param {number} health - Current health (0-100)
 */
export function updateVisor(health) {
    if (health > 25 && visorState.isLowHealth) {
        disableLowHealthMode();
    }
}
