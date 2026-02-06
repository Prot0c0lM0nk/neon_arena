/**
 * Logger Configuration
 * Toggle which log categories are active
 * 
 * INTENT: Central place to control logging verbosity
 * INTENT: Easy to disable all logging for production
 * INTENT: Enable specific categories for debugging specific issues
 * 
 * USAGE:
 *   Edit this file to enable/disable categories, then refresh browser
 *   Changes take effect immediately (no rebuild needed with Vite)
 */

export const LOG_CONFIG = {
    // Master switch - set to false to disable ALL logging
    enabled: true,
    
    // Minimum log level to display
    // DEBUG=0, INFO=1, WARN=2, ERROR=3
    // Set to 1 to hide DEBUG logs, 2 to hide DEBUG+INFO, etc.
    minLevel: 0,
    
    // Category toggles - set to true to enable, false to disable
    categories: {
        SPAWN: true,       // Enemy spawning (low noise, useful)
        COMBAT: true,      // Hits, kills, damage (essential)
        BULLET: false,     // Bullet trajectory (very noisy)
        COLLISION: false,  // Wall collisions (noisy)
        MOVEMENT: false,   // Enemy/player movement (very noisy)
        STATE: true,       // Game state changes (start, round, over)
        INPUT: false,      // Keyboard/mouse input (noisy)
        WEAPON: true,      // Firing, reloading, ammo changes
        ENGINE: false,     // Three.js scene updates (very noisy)
        SYSTEM: true       // General system messages
    }
};

/**
 * Quick presets for common debugging scenarios
 * Uncomment one of these and set LOG_CONFIG = PRESETS.xxx
 */
export const PRESETS = {
    // Everything on (maximum verbosity)
    all: {
        enabled: true,
        minLevel: 0,
        categories: {
            SPAWN: true, COMBAT: true, BULLET: true, COLLISION: true,
            MOVEMENT: true, STATE: true, INPUT: true, WEAPON: true,
            ENGINE: true, SYSTEM: true
        }
    },
    
    // Only essential logs (production-like)
    minimal: {
        enabled: true,
        minLevel: 1, // Hide DEBUG
        categories: {
            SPAWN: true, COMBAT: true, BULLET: false, COLLISION: false,
            MOVEMENT: false, STATE: true, INPUT: false, WEAPON: true,
            ENGINE: false, SYSTEM: true
        }
    },
    
    // Debugging combat issues (hits, damage, kills)
    combat: {
        enabled: true,
        minLevel: 0,
        categories: {
            SPAWN: true, COMBAT: true, BULLET: true, COLLISION: false,
            MOVEMENT: false, STATE: true, INPUT: false, WEAPON: true,
            ENGINE: false, SYSTEM: false
        }
    },
    
    // Debugging movement/collision issues
    physics: {
        enabled: true,
        minLevel: 0,
        categories: {
            SPAWN: false, COMBAT: false, BULLET: true, COLLISION: true,
            MOVEMENT: true, STATE: false, INPUT: false, WEAPON: false,
            ENGINE: false, SYSTEM: false
        }
    },
    
    // Completely silent (production)
    silent: {
        enabled: false,
        minLevel: 3,
        categories: {}
    }
};

// Example: To use a preset, uncomment below:
// export const LOG_CONFIG = PRESETS.combat;
