/**
 * Minimap rendering utility
 * Creates a 2D overhead view of the game world showing player and enemy positions
 * 
 * INTENT: Provide tactical awareness through overhead view
 * INTENT: Separate canvas drawing logic from game state
 * 
 * INVARIANT: #minimapCanvas element must exist in DOM
 * INVARIANT: Canvas size is fixed at 200x200 pixels
 * INVARIANT: World coordinates are normalized to canvas coordinates
 * 
 * DEPENDENCIES: Uses global DOM element: #minimapCanvas
 * DEPENDENCIES: Called every frame by animate() function
 * DEPENDENCIES: References player.position, camera.quaternion, enemies array
 * DEPENDENCIES: References worldWidth, worldDepth for coordinate scaling
 * 
 * COORDINATE TRANSFORMATION:
 *   World coordinates: (-worldWidth/2, -worldDepth/2) to (worldWidth/2, worldDepth/2)
 *   Canvas coordinates: (0, 0) to (200, 200)
 *   Scale factor: 200 / max(worldWidth, worldDepth)
 * 
 * NOTE: Player direction is calculated from camera orientation
 * NOTE: Enemies are drawn as red dots, player as cyan dot with direction line
 */

/**
 * Renders the minimap with current game state
 * @param {THREE.Object3D} player - Player object with position property
 * @param {THREE.PerspectiveCamera} camera - Camera for player direction calculation
 * @param {Array} enemies - Array of enemy objects with position property
 * @param {number} worldWidth - Width of the game world in meters
 * @param {number} worldDepth - Depth of the game world in meters
 */
export function updateMinimap(player, camera, enemies, worldWidth, worldDepth) {
    const canvas = document.getElementById('minimapCanvas');
    const ctx = canvas.getContext('2d');
    const size = 200;  // Fixed minimap size
    const scale = size / Math.max(worldWidth, worldDepth);
    
    // Set canvas size (ensure it matches container)
    canvas.width = size;
    canvas.height = size;
    
    // Clear canvas with semi-transparent background
    ctx.clearRect(0, 0, size, size);
    
    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, size, size);
    
    // Draw player position
    const playerX = (player.position.x + worldWidth/2) * scale;
    const playerY = (player.position.z + worldDepth/2) * scale;
    ctx.fillStyle = '#00ffea';  // Cyan color
    ctx.beginPath();
    ctx.arc(playerX, playerY, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw player direction line
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);
    ctx.strokeStyle = '#00ffea';
    ctx.beginPath();
    ctx.moveTo(playerX, playerY);
    ctx.lineTo(
        playerX + direction.x * 10,
        playerY + direction.z * 10
    );
    ctx.stroke();
    
    // Draw enemy positions
    enemies.forEach(enemy => {
        const enemyX = (enemy.position.x + worldWidth/2) * scale;
        const enemyY = (enemy.position.z + worldDepth/2) * scale;
        ctx.fillStyle = '#ff0000';  // Red color
        ctx.beginPath();
        ctx.arc(enemyX, enemyY, 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

/**
 * Initializes the minimap canvas
 * Ensures canvas has correct dimensions and context
 */
export function initMinimap() {
    const canvas = document.getElementById('minimapCanvas');
    const ctx = canvas.getContext('2d');
    
    // Set initial canvas size
    canvas.width = 200;
    canvas.height = 200;
    
    // Clear and set initial background
    ctx.clearRect(0, 0, 200, 200);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, 200, 200);
}