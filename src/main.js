/**
 * Main game entry point
 * Imports all modules and initializes the game
 * 
 * INTENT: Single entry point for modular game
 * INTENT: Centralize all imports for dependency management
 */

// Import configuration
import { weapons } from './config/weapons.js';
import {
    ENEMY_COLORS, ENEMY_SPEED, ENEMY_DAMAGE, ENEMY_FIRE_RATE, ENEMY_RANGE,
    PLAYER_HEIGHT, PLAYER_SPEED, WORLD_WIDTH, WORLD_DEPTH,
    INITIAL_HEALTH, INITIAL_ROUND, INITIAL_ENEMY_COUNT,
    COLLISION_DISTANCE, ENEMY_SPAWN_DISTANCE, ENEMY_OBSTACLE_DISTANCE,
    GAME_OVER_DELAY, BLACK_SCREEN_DELAY
} from './config/constants.js';

// TODO: Import other modules as we extract them
// import { setupEventListeners } from './utils/input.js';
// import { createPlayer } from './entities/player.js';
// import { createEnvironment } from './entities/world.js';
// import { createEnemies } from './entities/enemy.js';
// import { updateHUD, updateMinimap } from './utils/hud.js';
// import { startGame, gameOver, nextRound, fireWeapon } from './core/game.js';

// Global state variables (to be moved to appropriate modules)
let scene, camera, renderer, controls, clock;
let raycaster, mouse;
let player, enemies = [], bullets = [], enemyBullets = [];
let weaponType = 'rifle';
let ammo = 0, maxAmmo = 0, health = 100;
let round = 1, enemiesInRound = 5;
let gameStarted = false;
let lastFireTime = 0, lastEnemyFireTime = 0;
let playerDirection = new THREE.Vector3();
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let canJump = false, velocity = new THREE.Vector3();
let obstacles = [];

console.log('Game modules loaded successfully');
console.log('Weapon config:', weapons);
console.log('Constants loaded');

// TODO: Replace this with modular initialization
// init();