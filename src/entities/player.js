/**
 * Player entity factory
 * Creates the player object for position tracking and collision
 * 
 * INTENT: Separate player creation from scene setup
 * INTENT: Provide a factory function that can be tested independently
 * 
 * INVARIANT: Player is an invisible Object3D (visuals are handled by camera)
 * INVARIANT: Player Y position is set to playerHeight
 * 
 * DEPENDENCIES: Called by setupScene() during game initialization
 * DEPENDENCIES: Player position is updated by updatePlayer() every frame
 * 
 * NOTE: This is a factory function - it creates and returns a new player instance
 * NOTE: The player object is the source of truth for position; camera follows it
 */

/**
 * Creates a player entity
 * @param {THREE.Scene} scene - The Three.js scene to add the player to
 * @param {number} playerHeight - The height of the player (camera height)
 * @returns {THREE.Object3D} The created player object
 */
export function createPlayer(scene, playerHeight) {
    // Player is represented by an invisible Object3D at camera height
    // This separates the logical player entity from the visual camera
    const player = new THREE.Object3D();
    player.position.y = playerHeight;
    scene.add(player);
    
    return player;
}
