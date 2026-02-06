/**
 * Centralized Logging System
 * Replaces scattered console.log with configurable, categorized logging
 * 
 * INTENT: Provide consistent, toggleable logging across all game systems
 * INTENT: Make debugging easier by filtering noise
 * INTENT: Allow production builds to disable all logging
 * 
 * USAGE:
 *   import { log, CATEGORIES, LEVELS } from './utils/logger.js';
 *   log(CATEGORIES.COMBAT, LEVELS.INFO, 'Enemy hit', { enemy: 'Droid-1', damage: 20 });
 * 
 * CONFIGURATION:
 *   Edit logger-config.js to enable/disable categories
 */

import { LOG_CONFIG } from '../config/logger-config.js';

/**
 * Log severity levels
 * Higher numbers = more important (ERROR > WARN > INFO > DEBUG)
 */
export const LEVELS = {
    DEBUG: 0,  // Detailed diagnostic info (very noisy)
    INFO: 1,   // General operational info
    WARN: 2,   // Warning conditions
    ERROR: 3   // Error conditions
};

/**
 * Log categories for different game systems
 * Use these constants instead of strings for consistency
 */
export const CATEGORIES = {
    SPAWN: 'SPAWN',       // Enemy spawning
    COMBAT: 'COMBAT',     // Hits, kills, damage, health changes
    BULLET: 'BULLET',     // Bullet trajectory, position
    COLLISION: 'COLLISION', // Wall/obstacle collisions
    MOVEMENT: 'MOVEMENT', // Enemy/player movement
    STATE: 'STATE',       // Game state changes (start, round, game over)
    INPUT: 'INPUT',       // Keyboard/mouse input
    WEAPON: 'WEAPON',     // Firing, reloading, ammo
    ENGINE: 'ENGINE',     // Three.js scene, rendering
    SYSTEM: 'SYSTEM'      // General system messages
};

/**
 * Format a log message with consistent styling
 * @param {string} category - Log category
 * @param {number} level - Log level (0-3)
 * @param {string} message - Main message
 * @param {Object} data - Optional data object
 * @returns {string} Formatted log string
 */
function formatLog(category, level, message, data) {
    const levelName = Object.keys(LEVELS).find(k => LEVELS[k] === level) || 'UNKNOWN';
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
    
    let formatted = `[${timestamp}] [${category}] [${levelName}] ${message}`;
    
    if (data && Object.keys(data).length > 0) {
        const dataStr = Object.entries(data)
            .map(([k, v]) => `${k}=${formatValue(v)}`)
            .join(', ');
        formatted += ` {${dataStr}}`;
    }
    
    return formatted;
}

/**
 * Format a value for display
 */
function formatValue(value) {
    if (typeof value === 'number') {
        return Number.isInteger(value) ? value : value.toFixed(2);
    }
    if (typeof value === 'string') {
        return value.length > 20 ? value.substring(0, 20) + '...' : value;
    }
    return String(value);
}

/**
 * Main logging function
 * @param {string} category - One of CATEGORIES constants
 * @param {number} level - One of LEVELS constants
 * @param {string} message - Log message
 * @param {Object} data - Optional data to include
 */
export function log(category, level, message, data = null) {
    // Check if this category is enabled
    if (!LOG_CONFIG.categories[category]) {
        return; // Silently skip disabled categories
    }
    
    // Check if this level meets the minimum threshold
    if (level < LOG_CONFIG.minLevel) {
        return; // Skip logs below minimum level
    }
    
    // Check if global logging is disabled
    if (!LOG_CONFIG.enabled) {
        return;
    }
    
    const formatted = formatLog(category, level, message, data);
    
    // Use appropriate console method based on level
    switch (level) {
        case LEVELS.ERROR:
            console.error(formatted, data || '');
            break;
        case LEVELS.WARN:
            console.warn(formatted, data || '');
            break;
        case LEVELS.DEBUG:
            console.debug(formatted, data || '');
            break;
        default:
            console.log(formatted, data || '');
    }
}

/**
 * Quick log functions for common patterns
 * These are convenience wrappers around log()
 */
export const debug = (cat, msg, data) => log(cat, LEVELS.DEBUG, msg, data);
export const info = (cat, msg, data) => log(cat, LEVELS.INFO, msg, data);
export const warn = (cat, msg, data) => log(cat, LEVELS.WARN, msg, data);
export const error = (cat, msg, data) => log(cat, LEVELS.ERROR, msg, data);

/**
 * Group related logs together
 * Usage:
 *   logGroup(CATEGORIES.COMBAT, 'Combat Round 1', () => {
 *       log(CATEGORIES.COMBAT, LEVELS.INFO, 'Hit 1');
 *       log(CATEGORIES.COMBAT, LEVELS.INFO, 'Hit 2');
 *   });
 */
export function logGroup(category, label, fn) {
    if (!LOG_CONFIG.categories[category] || !LOG_CONFIG.enabled) {
        return fn(); // Still execute, just don't log
    }
    
    console.group(`[${category}] ${label}`);
    try {
        fn();
    } finally {
        console.groupEnd();
    }
}

/**
 * Log an object's state for debugging
 * @param {string} category - Log category
 * @param {string} label - Label for the object
 * @param {Object} obj - Object to inspect
 */
export function logObject(category, label, obj) {
    if (!LOG_CONFIG.categories[category] || !LOG_CONFIG.enabled) {
        return;
    }
    
    console.log(`[${category}] ${label}:`, obj);
}
