/**
 * Game configuration constants
 * Centralized location for all game-wide settings and values.
 * 
 * INTENT: Single source of truth for game configuration
 * INTENT: Enable easy balancing and tuning
 * 
 * INVARIANT: Values should be numeric or simple data types
 * INVARIANT: Constants should not contain complex logic
 */

/**
 * Enemy configuration constants
 * These values define enemy behavior and appearance
 */
export const ENEMY_COLORS = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff]; // Color palette for enemy variety
export const ENEMY_SPEED = 0.02;          // Movement speed per frame
export const ENEMY_DAMAGE = 5;            // Damage per enemy bullet
export const ENEMY_FIRE_RATE = 1000;      // Time between shots in milliseconds
export const ENEMY_RANGE = 15;            // Distance at which enemies start shooting

/**
 * Player configuration constants
 * Player movement, physics, and world settings
 */
export const PLAYER_HEIGHT = 1.6;         // Player camera height (meters)
export const PLAYER_SPEED = 0.2;          // Movement speed per frame
export const WORLD_WIDTH = 50;            // Arena width in meters
export const WORLD_DEPTH = 50;            // Arena depth in meters

/**
 * Game state defaults
 * Initial values for game progression
 */
export const INITIAL_HEALTH = 100;        // Starting player health
export const INITIAL_ROUND = 1;           // Starting round number
export const INITIAL_ENEMY_COUNT = 5;     // Enemies in first round

/**
 * Collision and physics constants
 */
export const COLLISION_DISTANCE = 1.5;    // Safe distance from obstacles
export const ENEMY_SPAWN_DISTANCE = 10;   // Min distance from player for spawn
export const ENEMY_OBSTACLE_DISTANCE = 3; // Min distance from walls for spawn

/**
 * UI and visual constants
 */
export const GAME_OVER_DELAY = 2000;      // 2 seconds for game over sequence
export const BLACK_SCREEN_DELAY = 2000;   // 2 seconds for black screen transition