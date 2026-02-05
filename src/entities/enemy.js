/**
 * Enemy entity factory
 * Spawns enemy entities for a new round
 * 
 * INTENT: Provide fresh enemy set for each round
 * INTENT: Ensure enemies spawn in valid locations (not on player or in walls)
 * INTENT: Cycle through color palette for visual variety
 * 
 * INVARIANT: All existing enemies are removed before new ones are created
 * INVARIANT: Enemies spawn at least 10 meters from player
 * INVARIANT: Enemies spawn at least 3 meters from any wall/obstacle
 * INVARIANT: Enemy Y position is fixed at 1 (half their height)
 * INVARIANT: Enemy health is always initialized to 100
 * INVARIANT: Enemy lastShot is always initialized to 0
 * 
 * DEPENDENCIES: Called by startGame() and nextRound()
 * DEPENDENCIES: Uses ENEMY_COLORS for visual variety
 * DEPENDENCIES: References player.position for distance check
 * DEPENDENCIES: References obstacles[] for collision check
 * 
 * ENEMY MESH PROPERTIES:
 *   - Geometry: ConeGeometry(0.5 radius, 2 height, 8 segments)
 *   - Material: MeshStandardMaterial with color from ENEMY_COLORS
 *   - Position: Y=1 (sits on floor, cone height is 2)
 *   - Custom properties: health (number), lastShot (timestamp)
 * 
 * SPAWN VALIDATION RULES:
 *   1. Must be >10m from player (fair engagement distance)
 *   2. Must be >3m from any obstacle (not inside walls)
 *   3. Within arena bounds (worldWidth/Depth - 10 margin)
 * 
 * NOTE: Uses rejection sampling - may loop multiple times per enemy
 * NOTE: Enemy cone points up by default, lookAt() in updateEnemies() orients them
 */

/**
 * Creates enemy entities for a round
 * @param {THREE.Scene} scene - The Three.js scene to add enemies to
 * @param {number} count - Number of enemies to create
 * @param {Array} enemyColors - Array of color values for enemy variety
 * @param {THREE.Object3D} player - Player object for spawn distance checking
 * @param {Array} obstacles - Array of obstacle meshes to avoid
 * @param {number} worldWidth - Width of the arena in meters
 * @param {number} worldDepth - Depth of the arena in meters
 * @returns {Array} Array of created enemy meshes
 */
export function createEnemies(scene, count, enemyColors, player, obstacles, worldWidth, worldDepth) {
    const enemies = [];
    
    // Create requested number of enemies
    for (let i = 0; i < count; i++) {
        // Cone geometry: radius 0.5, height 2, 8 radial segments
        const enemyGeometry = new THREE.ConeGeometry(0.5, 2, 8);
        const enemyMaterial = new THREE.MeshStandardMaterial({ 
            color: enemyColors[i % enemyColors.length],  // Cycle through colors
            roughness: 0.5,
            metalness: 0.5
        });
        const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
        
        // Find valid spawn position using rejection sampling
        let positionFound = false;
        while (!positionFound) {
            // Random position within arena bounds (5m margin from edges)
            const enemyX = Math.random() * (worldWidth - 10) - (worldWidth/2 - 5);
            const enemyZ = Math.random() * (worldDepth - 10) - (worldDepth/2 - 5);
            
            enemy.position.set(enemyX, 1, enemyZ);  // Y=1 for cone geometry
            
            // Rule 1: Don't spawn too close to player (minimum 10m)
            const distanceToPlayer = enemy.position.distanceTo(player.position);
            if (distanceToPlayer < 10) {
                continue;  // Try again
            }

            // Rule 2: Don't spawn inside or too close to walls
            if (obstacles.some(obs => enemy.position.distanceTo(obs.position) < 3.0)) {
                continue;  // Try again
            }
            
            positionFound = true;  // Valid position found
        }
        
        // Initialize enemy state
        enemy.health = 100;        // Full health
        enemy.lastShot = 0;        // Timestamp of last shot (0 = never)
        enemy.castShadow = true;   // Cast shadows
        scene.add(enemy);
        enemies.push(enemy);
    }
    
    return enemies;
}

/**
 * Clears all existing enemies from the scene
 * @param {THREE.Scene} scene - The Three.js scene containing enemies
 * @param {Array} enemies - Array of enemy meshes to remove
 */
export function clearEnemies(scene, enemies) {
    enemies.forEach(enemy => scene.remove(enemy));
}
