/**
 * World environment factory
 * Creates the game arena with floor, walls, and lighting
 * 
 * INTENT: Create a visually cohesive arena with tactical cover
 * INTENT: Ensure walls don't spawn too close to player spawn (0,0)
 * INTENT: Provide both ambient and directional lighting with shadows
 * 
 * INVARIANT: Floor must be at Y=0 (rotated -90 degrees on X)
 * INVARIANT: Walls must be at least 5 meters from center (player spawn)
 * INVARIANT: Exactly 10 walls are created for cover
 * INVARIANT: All walls are added to obstacles[] for collision detection
 * INVARIANT: Wall Y position is half its height (so it sits on floor)
 * 
 * DEPENDENCIES: Called by setupScene() during game initialization
 * DEPENDENCIES: Returns obstacles array for collision detection
 * 
 * WALL GENERATION ALGORITHM:
 *   1. Random dimensions: width 2-7m, height 1-3m, depth 2-7m
 *   2. Random position within arena (with 5m margin from edges)
 *   3. Reject positions within 5m of center (player spawn protection)
 *   4. Add to scene and obstacles array
 * 
 * LIGHTING SETUP:
 *   - Ambient: 0x404040 (soft gray fill)
 *   - Directional: White, intensity 0.8, from (0, 20, 10) with shadows
 * 
 * NOTE: Wall spawn uses rejection sampling - may loop multiple times per wall
 * NOTE: Material roughness/metalness gives subtle industrial aesthetic
 */

/**
 * Creates the game environment
 * @param {THREE.Scene} scene - The Three.js scene to add objects to
 * @param {number} worldWidth - Width of the arena in meters
 * @param {number} worldDepth - Depth of the arena in meters
 * @returns {Array} Array of obstacle meshes for collision detection
 */
export function createEnvironment(scene, worldWidth, worldDepth) {
    const obstacles = [];
    
    // Create floor plane - rotated -90 degrees on X to be horizontal
    const floorGeometry = new THREE.PlaneGeometry(worldWidth, worldDepth);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333344,      // Dark blue-gray
        roughness: 0.8,       // Matte finish
        metalness: 0.2        // Slight metallic sheen
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;  // Rotate to horizontal
    floor.receiveShadow = true;        // Receive shadows from objects
    scene.add(floor);
    
    // Generate 10 random walls for tactical cover
    for (let i = 0; i < 10; i++) {
        // Random wall dimensions
        const wallWidth = Math.random() * 5 + 2;   // 2-7 meters
        const wallHeight = Math.random() * 2 + 1;  // 1-3 meters
        const wallDepth = Math.random() * 5 + 2;   // 2-7 meters
        
        const wallGeometry = new THREE.BoxGeometry(wallWidth, wallHeight, wallDepth);
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x444455,      // Slightly lighter than floor
            roughness: 0.7,       // Slightly less rough
            metalness: 0.3        // More metallic
        });
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);

        let wallX, wallZ;
        let tooClose = true;

        // Rejection sampling: keep trying until position is valid
        while (tooClose) {
            // Random position within arena bounds (with 5m margin)
            wallX = Math.random() * (worldWidth - 10) - (worldWidth/2 - 5);
            wallZ = Math.random() * (worldDepth - 10) - (worldDepth/2 - 5);
            
            // Calculate distance from center (0,0) - player spawn point
            const distanceFromCenter = Math.sqrt(wallX * wallX + wallZ * wallZ);
            if (distanceFromCenter > 5) {  // 5 meters is safe distance
                tooClose = false;
            }
        }

        // Position wall so it sits on floor (Y at half height)
        wall.position.set(wallX, wallHeight/2, wallZ);
        wall.castShadow = true;      // Cast shadows on other objects
        wall.receiveShadow = true;   // Receive shadows
        scene.add(wall);
        
        // CRITICAL: Add to obstacles array for collision detection
        obstacles.push(wall);
    }
    
    // Ambient light - soft fill lighting from all directions
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    // Directional light - main light source with shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 20, 10);  // Above and slightly forward
    directionalLight.castShadow = true;         // Enable shadow casting
    scene.add(directionalLight);
    
    return obstacles;
}
