/**
 * HUD (Heads-Up Display) utility functions
 * Updates the in-game UI elements with current game state
 * 
 * INTENT: Separate UI updates from game logic
 * INTENT: Provide real-time feedback to player
 * 
 * INVARIANT: DOM elements must exist before calling these functions
 * INVARIANT: Values are displayed as-is (no formatting beyond basic string)
 * 
 * DEPENDENCIES: Uses global DOM elements: #ammo, #health, #round
 * DEPENDENCIES: Called by startGame(), fireWeapon(), reloadWeapon(), gameOver()
 * 
 * NOTE: This is a pure function - no side effects beyond DOM updates
 * NOTE: Health is clamped to 0 to prevent negative display
 */

/**
 * Updates all HUD elements with current game state
 * @param {number} ammo - Current ammunition count
 * @param {number} maxAmmo - Maximum ammunition capacity
 * @param {number} health - Current player health
 * @param {number} round - Current round number
 */
export function updateHUD(ammo, maxAmmo, health, round) {
    // Update ammo counter
    document.getElementById('ammo').textContent = `AMMO: ${ammo}/${maxAmmo}`;
    
    // Update health (clamp to 0 to prevent negative values)
    document.getElementById('health').textContent = `HEALTH: ${Math.max(0, Math.floor(health))}`;
    
    // Update round counter
    document.getElementById('round').textContent = `ROUND: ${round}`;
}

/**
 * Updates only the ammo display
 * Useful for reload operations without full HUD refresh
 * @param {number} ammo - Current ammunition count
 * @param {number} maxAmmo - Maximum ammunition capacity
 */
export function updateAmmo(ammo, maxAmmo) {
    document.getElementById('ammo').textContent = `AMMO: ${ammo}/${maxAmmo}`;
}

/**
 * Updates only the health display
 * Useful for damage/healing events without full HUD refresh
 * @param {number} health - Current player health
 */
export function updateHealth(health) {
    document.getElementById('health').textContent = `HEALTH: ${Math.max(0, Math.floor(health))}`;
}

/**
 * Updates only the round display
 * Useful for round progression without full HUD refresh
 * @param {number} round - Current round number
 */
export function updateRound(round) {
    document.getElementById('round').textContent = `ROUND: ${round}`;
}