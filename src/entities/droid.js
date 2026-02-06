/**
 * Droid enemy entity factory
 * Creates blocky, mechanical droid enemies (inspired by training droids)
 * 
 * INTENT: Replace cone enemies with robotic, mechanical foes
 * INTENT: Maintain low-poly aesthetic while adding sci-fi character
 * INTENT: Provide visual variety through different droid configurations
 * 
 * DESIGN PRINCIPLES:
 *   - Blocky construction (BoxGeometry primitives)
 *   - Mechanical details (antennas, vents, panel lines)
 *   - Glowing elements (eyes, sensors, power cores)
 *   - Rigid, robotic appearance (no organic curves)
 * 
 * INVARIANT: All droids face player using lookAt()
 * INVARIANT: Droids have health and lastShot properties
 * INVARIANT: Droids cast shadows for depth perception
 */

import { log, CATEGORIES, LEVELS } from '../utils/logger.js';

/**
 * Creates a blocky droid enemy
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {number} color - Hex color for droid body
 * @param {THREE.Object3D} player - Player for spawn distance checking
 * @param {Array} obstacles - Obstacles to avoid
 * @param {number} worldWidth - Arena width
 * @param {number} worldDepth - Arena depth
 * @returns {THREE.Group} The droid group object
 */

/**
 * Creates a blocky droid enemy
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {number} color - Hex color for droid body
 * @param {THREE.Object3D} player - Player for spawn distance checking
 * @param {Array} obstacles - Obstacles to avoid
 * @param {number} worldWidth - Arena width
 * @param {number} worldDepth - Arena depth
 * @returns {THREE.Group} The droid group object
 */
export function createDroid(scene, color, player, obstacles, worldWidth, worldDepth) {
    // Create droid as a group of meshes
    const droid = new THREE.Group();
    
    // Materials
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.3,
        metalness: 0.7
    });
    
    const darkMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.8,
        metalness: 0.3
    });
    
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00, // Green glow - can be changed per droid type
        transparent: true,
        opacity: 0.9
    });
    
    // ========== TORSO ==========
    // Main body block - 0.8 x 1.0 x 0.6
    const torsoGeometry = new THREE.BoxGeometry(0.8, 1.0, 0.6);
    const torso = new THREE.Mesh(torsoGeometry, bodyMaterial);
    torso.position.y = 1.0; // Center at 1.0, extends from 0.5 to 1.5
    torso.castShadow = true;
    torso.receiveShadow = true;
    droid.add(torso);
    
    // Chest plate detail (slightly smaller box in front)
    const chestGeometry = new THREE.BoxGeometry(0.6, 0.5, 0.1);
    const chest = new THREE.Mesh(chestGeometry, darkMaterial);
    chest.position.set(0, 1.1, 0.35); // Front of torso
    chest.castShadow = true;
    droid.add(chest);
    
    // Power core glow (small box on chest)
    const coreGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.05);
    const core = new THREE.Mesh(coreGeometry, glowMaterial);
    core.position.set(0, 1.1, 0.41);
    droid.add(core);
    
    // ========== HEAD ==========
    // Head block - 0.5 x 0.4 x 0.5
    const headGeometry = new THREE.BoxGeometry(0.5, 0.4, 0.5);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.y = 1.7; // On top of torso
    head.castShadow = true;
    droid.add(head);
    
    // Eye/sensor band (horizontal strip)
    const eyeBandGeometry = new THREE.BoxGeometry(0.52, 0.1, 0.4);
    const eyeBand = new THREE.Mesh(eyeBandGeometry, darkMaterial);
    eyeBand.position.set(0, 1.7, 0.08);
    droid.add(eyeBand);
    
    // Glowing eye
    const eyeGeometry = new THREE.BoxGeometry(0.3, 0.06, 0.05);
    const eye = new THREE.Mesh(eyeGeometry, glowMaterial);
    eye.position.set(0, 1.7, 0.29);
    droid.add(eye);
    
    // Antenna (thin cylinder or box on head)
    const antennaGeometry = new THREE.BoxGeometry(0.05, 0.3, 0.05);
    const antenna = new THREE.Mesh(antennaGeometry, darkMaterial);
    antenna.position.set(0.15, 1.95, 0);
    droid.add(antenna);
    
    // Antenna tip glow
    const antennaTipGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const antennaTip = new THREE.Mesh(antennaTipGeometry, glowMaterial);
    antennaTip.position.set(0.15, 2.1, 0);
    droid.add(antennaTip);
    
    // ========== ARMS ==========
    // Left arm
    const armGeometry = new THREE.BoxGeometry(0.25, 0.8, 0.25);
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-0.6, 1.0, 0);
    leftArm.castShadow = true;
    droid.add(leftArm);
    
    // Right arm
    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(0.6, 1.0, 0);
    rightArm.castShadow = true;
    droid.add(rightArm);
    
    // Shoulder pads
    const shoulderGeometry = new THREE.BoxGeometry(0.35, 0.2, 0.35);
    const leftShoulder = new THREE.Mesh(shoulderGeometry, darkMaterial);
    leftShoulder.position.set(-0.6, 1.4, 0);
    droid.add(leftShoulder);
    
    const rightShoulder = new THREE.Mesh(shoulderGeometry, darkMaterial);
    rightShoulder.position.set(0.6, 1.4, 0);
    droid.add(rightShoulder);
    
    // Blaster barrels (on right arm - the shooting arm)
    const barrelGeometry = new THREE.BoxGeometry(0.08, 0.3, 0.08);
    const barrel = new THREE.Mesh(barrelGeometry, darkMaterial);
    barrel.position.set(0.6, 0.6, 0.2);
    droid.add(barrel);
    
    // Barrel tip glow
    const barrelTipGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const barrelTip = new THREE.Mesh(barrelTipGeometry, glowMaterial);
    barrelTip.position.set(0.6, 0.45, 0.2);
    droid.add(barrelTip);
    
    // ========== LEGS ==========
    // Left leg
    const legGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.4);
    const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    leftLeg.position.set(-0.25, 0.4, 0);
    leftLeg.castShadow = true;
    droid.add(leftLeg);
    
    // Right leg
    const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    rightLeg.position.set(0.25, 0.4, 0);
    rightLeg.castShadow = true;
    droid.add(rightLeg);
    
    // Feet
    const footGeometry = new THREE.BoxGeometry(0.35, 0.15, 0.5);
    const leftFoot = new THREE.Mesh(footGeometry, darkMaterial);
    leftFoot.position.set(-0.25, 0.075, 0.05);
    droid.add(leftFoot);
    
    const rightFoot = new THREE.Mesh(footGeometry, darkMaterial);
    rightFoot.position.set(0.25, 0.075, 0.05);
    droid.add(rightFoot);
    
    // ========== DETAILS ==========
    // Back vents (two small boxes on back)
    const ventGeometry = new THREE.BoxGeometry(0.15, 0.3, 0.05);
    const leftVent = new THREE.Mesh(ventGeometry, darkMaterial);
    leftVent.position.set(-0.2, 1.0, -0.32);
    droid.add(leftVent);
    
    const rightVent = new THREE.Mesh(ventGeometry, darkMaterial);
    rightVent.position.set(0.2, 1.0, -0.32);
    droid.add(rightVent);
    
    // ========== SPAWN POSITION ==========
    // Find valid spawn position
    let positionFound = false;
    while (!positionFound) {
        const spawnX = Math.random() * (worldWidth - 10) - (worldWidth/2 - 5);
        const spawnZ = Math.random() * (worldDepth - 10) - (worldDepth/2 - 5);
        
        droid.position.set(spawnX, 0, spawnZ);
        
        // Check distance from player
        const distanceToPlayer = droid.position.distanceTo(player.position);
        if (distanceToPlayer < 10) continue;
        
        // Check distance from obstacles
        if (obstacles.some(obs => droid.position.distanceTo(obs.position) < 3.0)) continue;
        
        positionFound = true;
    }
    
    // ========== GAME PROPERTIES ==========
    droid.health = 100;
    droid.lastShot = 0;
    
    // Add to scene
    scene.add(droid);
    
    return droid;
}


/**
 * Creates multiple droid enemies
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {number} count - Number of droids to create
 * @param {Array} colors - Array of colors for variety
 * @param {THREE.Object3D} player - Player object
 * @param {Array} obstacles - Obstacles array
 * @param {number} worldWidth - Arena width
 * @param {number} worldDepth - Arena depth
 * @returns {Array} Array of droid groups
 */
export function createDroids(scene, count, colors, player, obstacles, worldWidth, worldDepth) {
    const droids = [];
    
    for (let i = 0; i < count; i++) {
        const color = colors[i % colors.length];
        const droid = createDroid(scene, color, player, obstacles, worldWidth, worldDepth);
        droid.userData.id = i;
        droid.userData.name = `Droid-${i}`;
        droid.name = `Droid-${i}`;  // Also set Three.js name property
        droids.push(droid);
        
        log(CATEGORIES.SPAWN, LEVELS.INFO, `${droid.name} spawned`, {
            id: i,
            x: droid.position.x.toFixed(1),
            z: droid.position.z.toFixed(1)
        });
    }
    
    return droids;
}

/**
 * Clears all droids from scene
 * @param {THREE.Scene} scene - The scene
 * @param {Array} droids - Array of droid groups
 */
export function clearDroids(scene, droids) {
    droids.forEach(droid => scene.remove(droid));
}
