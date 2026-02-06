/**
 * Core game logic module
 * Manages game state transitions, weapon systems, and round progression
 * 
 * INTENT: Centralize game flow control (start, game over, next round)
 * INTENT: Separate game logic from rendering and input handling
 * 
 * INVARIANT: Game state changes are atomic (no partial updates)
 * INVARIANT: UI updates always follow state changes
 * INVARIANT: Pointer lock state matches game state
 * INVARIANT: Pointer lock state matches game state
 */

import { log, CATEGORIES, LEVELS } from '../utils/logger.js';

/**
 * Starts a new game session

/**
 * Starts a new game session
 * @param {Object} params - Game start parameters
 * @param {string} params.weaponType - Selected weapon type ('rifle', 'shotgun', 'sniper')
 * {Object} params.weapons - Weapon configuration object
 * @param {Function} params.updateHUD - Function to update HUD display
 * @param {Function} params.createEnemies - Function to spawn enemies
 * @param {THREE.PointerLockControls} params.controls - Pointer lock controls
 * @returns {Object} Initial game state
 */
export function startGame({ weaponType, weapons, updateHUD, createEnemies, controls }) {
    log(CATEGORIES.STATE, LEVELS.INFO, 'Starting game', { weapon: weaponType });
    
    // Get weapon configuration
    const weapon = weapons[weaponType];
    
    // Initialize game state
    const gameState = {
        ammo: weapon.ammo,
        maxAmmo: weapon.maxAmmo,
        health: 100,
        round: 1,
        enemiesInRound: 5,
        gameStarted: true,
        weaponType: weaponType
    };
    
    // Hide start screen, show game canvas
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    
    // Spawn first round enemies
    createEnemies(gameState.enemiesInRound);
    
    // Update HUD with initial values
    updateHUD(gameState.ammo, gameState.maxAmmo, gameState.health, gameState.round);
    
    // Enable pointer lock for FPS controls
    const element = document.body;
    element.requestPointerLock = element.requestPointerLock || 
                               element.mozRequestPointerLock || 
                               element.webkitRequestPointerLock;
    element.requestPointerLock();
    controls.lock();
    
    return gameState;
}

/**
 * Handles game over sequence
 * @param {Object} params - Game over parameters
 * @param {THREE.Camera} params.camera - Three.js camera for reset
 * @param {number} params.playerHeight - Player height for camera reset
 * @param {Function} params.onComplete - Callback when sequence completes
 */
export function gameOver({ camera, playerHeight, onComplete }) {
    // Show game over text
    document.getElementById('gameOver').style.display = 'block';
    
    // Release pointer lock to allow mouse interaction with menu
    document.exitPointerLock = document.exitPointerLock || 
                             document.mozExitPointerLock || 
                             document.webkitExitPointerLock;
    document.exitPointerLock();
    
    // Two-phase transition: game over text -> black screen -> menu
    setTimeout(() => {
        // Phase 1: Show black screen after 2 seconds
        document.getElementById('blackScreen').style.display = 'block';
        
        setTimeout(() => {
            // Phase 2: After another 2 seconds, return to menu
            document.getElementById('blackScreen').style.display = 'none';
            document.getElementById('gameOver').style.display = 'none';
            document.getElementById('gameContainer').style.display = 'none';
            document.getElementById('startScreen').style.display = 'flex';
            
            // Reset camera to default state
            camera.rotation.set(0, 0, 0);
            camera.position.y = playerHeight;
            
            // Call completion callback
            if (onComplete) onComplete();
        }, 2000);
    }, 2000);
}

/**
 * Progresses to the next round
 * @param {Object} params - Next round parameters
 * @param {number} params.currentRound - Current round number
 * @param {Function} params.createEnemies - Function to spawn enemies
 * @param {Function} params.updateHUD - Function to update HUD
 * @param {number} params.maxAmmo - Max ammo for current weapon
 * @returns {Object} Updated round state
 */
export function nextRound({ currentRound, createEnemies, updateHUD, maxAmmo }) {
    const newRound = currentRound + 1;
    const enemiesInRound = 5 + Math.floor(newRound * 1.5);
    
    // Spawn new wave of enemies
    createEnemies(enemiesInRound);
    
    // Update HUD to show new round
    updateHUD(maxAmmo, maxAmmo, 100, newRound); // Reset ammo and health display
    
    return {
        round: newRound,
        enemiesInRound: enemiesInRound
    };
}

/**
 * Fires the current weapon
 * @param {Object} params - Fire weapon parameters
 * @param {string} params.weaponType - Current weapon type
 * @param {Object} params.weapons - Weapon configuration
 * @param {number} params.ammo - Current ammo count
 * @param {number} params.lastFireTime - Timestamp of last shot
 * @param {THREE.Camera} params.camera - Player camera for direction
 * @param {THREE.Scene} params.scene - Scene to add bullets to
 * @param {Array} params.bullets - Array to add bullet objects to
 * @param {Function} params.updateHUD - Function to update ammo display
 * @returns {Object} Updated ammo and lastFireTime
 */
export function fireWeapon({ weaponType, weapons, ammo, lastFireTime, camera, scene, bullets, updateHUD }) {
    const weapon = weapons[weaponType];
    const currentTime = Date.now();
    
    // Check if we can fire (ammo and fire rate)
    if (ammo <= 0 || currentTime - lastFireTime < weapon.fireRate) {
        return { ammo, lastFireTime };
    }
    
    // Use ammo
    const newAmmo = ammo - 1;
    const newLastFireTime = currentTime;
    
    // Update HUD
    updateHUD(newAmmo, weapon.maxAmmo, null, null);
    
    // Create bullet direction based on camera direction
    const baseDirection = new THREE.Vector3(0, 0, -1);
    baseDirection.applyQuaternion(camera.quaternion);
    
    if (weaponType === 'shotgun' && weapon.pellets) {
        // Shotgun fires multiple pellets
        for (let i = 0; i < weapon.pellets; i++) {
            const pelletDirection = baseDirection.clone();
            pelletDirection.x += (Math.random() - 0.5) * weapon.spread;
            pelletDirection.y += (Math.random() - 0.5) * weapon.spread;
            pelletDirection.z += (Math.random() - 0.5) * weapon.spread;
            pelletDirection.normalize();
            
            createBullet(pelletDirection, weapon, camera, scene, bullets);
        }
    } else {
        // Other weapons fire single shot
        baseDirection.x += (Math.random() - 0.5) * weapon.spread;
        baseDirection.y += (Math.random() - 0.5) * weapon.spread;
        baseDirection.normalize();
        
        createBullet(baseDirection, weapon, camera, scene, bullets);
    }
    
    return { ammo: newAmmo, lastFireTime: newLastFireTime };
}

/**
 * Creates a bullet tracer
 * @param {THREE.Vector3} direction - Bullet direction
 * @param {Object} weapon - Weapon configuration
 * @param {THREE.Camera} camera - Player camera
 * @param {THREE.Scene} scene - Scene to add bullet to
 * @param {Array} bullets - Array to track bullet
 */
function createBullet(direction, weapon, camera, scene, bullets) {
    const origin = camera.position.clone();
    origin.y -= 0.5; // Adjust to gun height
    
    // Create tracer
    const tracerGeometry = new THREE.CylinderGeometry(
        weapon.tracerWidth, 
        weapon.tracerWidth, 
        weapon.tracerLength,
        8
    );
    const tracerMaterial = new THREE.MeshBasicMaterial({ 
        color: weapon.color,
        transparent: true,
        opacity: 0.8
    });
    const tracer = new THREE.Mesh(tracerGeometry, tracerMaterial);
    
    // Position and orient tracer
    tracer.position.copy(origin);
    tracer.lookAt(origin.clone().add(direction));
    tracer.rotateX(Math.PI / 2);
    scene.add(tracer);
    
    // Add bullet to array
    bullets.push({
        position: origin,
        direction: direction,
        speed: 1.0,
        range: weapon.range,
        damage: weapon.damage,
        mesh: tracer,
        distance: 0
    });
}

/**
 * Reloads the current weapon
 * @param {string} weaponType - Current weapon type
 * @param {Object} weapons - Weapon configuration
 * @param {number} currentAmmo - Current ammo count
 * @param {Function} updateHUD - Function to update ammo display
 * @returns {number} New ammo count
 */
export function reloadWeapon(weaponType, weapons, currentAmmo, updateHUD) {
    const maxAmmo = weapons[weaponType].maxAmmo;
    
    if (currentAmmo === maxAmmo) return currentAmmo;
    
    updateHUD(maxAmmo, maxAmmo, null, null);
    return maxAmmo;
}
