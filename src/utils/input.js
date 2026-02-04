/**
 * Input handling utilities
 * Manages keyboard and mouse input for player control
 * 
 * INTENT: Centralize all input processing
 * INTENT: Separate input logic from game state updates
 * 
 * INVARIANT: Input only processed when gameStarted = true
 * INVARIANT: Mouse movement coordinates normalized to [-1, 1] range
 * INVARIANT: Keyboard state flags are boolean values
 * 
 * DEPENDENCIES: Uses global state: gameStarted, mouse, moveForward, etc.
 * DEPENDENCIES: Calls fireWeapon() on mouse click
 * 
 * KEY CODES:
 *   W: 87 (forward)
 *   A: 65 (left)
 *   S: 83 (backward)
 *   D: 68 (right)
 *   Space: 32 (jump)
 *   R: 82 (reload)
 */

/**
 * Handles mouse movement for potential UI interactions
 * Note: Camera rotation is handled by PointerLockControls
 * @param {MouseEvent} event - Mouse move event
 * @param {boolean} gameStarted - Whether game is active
 * @param {THREE.Vector2} mouse - Mouse coordinate vector to update
 */
export function onMouseMove(event, gameStarted, mouse) {
    if (!gameStarted) return;
    
    // Normalize mouse coordinates to [-1, 1] range
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
}

/**
 * Handles mouse click for weapon firing
 * @param {MouseEvent} event - Mouse click event
 * @param {boolean} gameStarted - Whether game is active
 * @param {Function} fireWeapon - Weapon firing function to call
 */
export function onMouseClick(event, gameStarted, fireWeapon) {
    if (!gameStarted) return;
    
    fireWeapon();
}

/**
 * Handles keyboard key down events
 * Updates movement flags and triggers actions
 * @param {KeyboardEvent} event - Key down event
 * @param {boolean} gameStarted - Whether game is active
 * @param {Object} movementFlags - Object containing moveForward, moveBackward, etc.
 * @param {Object} playerState - Object containing canJump, velocity
 * @param {Function} reloadWeapon - Reload function to call
 */
export function onKeyDown(event, gameStarted, movementFlags, playerState, reloadWeapon) {
    if (!gameStarted) return;
    
    switch (event.keyCode) {
        case 87: // W (forward)
            movementFlags.moveForward = true;
            break;
        case 83: // S (backward)
            movementFlags.moveBackward = true;
            break;
        case 65: // A (left)
            movementFlags.moveLeft = true;
            break;
        case 68: // D (right)
            movementFlags.moveRight = true;
            break;
        case 32: // Space (jump)
            if (playerState.canJump) {
                playerState.velocity.y = 0.2;
                playerState.canJump = false;
            }
            break;
        case 82: // R (reload)
            reloadWeapon();
            break;
    }
}

/**
 * Handles keyboard key up events
 * Clears movement flags when keys are released
 * @param {KeyboardEvent} event - Key up event
 * @param {boolean} gameStarted - Whether game is active
 * @param {Object} movementFlags - Object containing moveForward, moveBackward, etc.
 */
export function onKeyUp(event, gameStarted, movementFlags) {
    if (!gameStarted) return;
    
    switch (event.keyCode) {
        case 87: // W
            movementFlags.moveForward = false;
            break;
        case 83: // S
            movementFlags.moveBackward = false;
            break;
        case 65: // A
            movementFlags.moveLeft = false;
            break;
        case 68: // D
            movementFlags.moveRight = false;
            break;
    }
}