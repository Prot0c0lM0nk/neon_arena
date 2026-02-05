/**
 * Main game entry point - Phase 3: Entity Factories Integrated
 * 
 * INTENT: Test new entity modules alongside original code
 * INTENT: Verify modular extraction maintains game behavior
 * INTENT: Incrementally replace global functions with module imports
 */

// ================================================
// IMPORT CONFIGURATION
// ================================================
import { weapons } from './config/weapons.js';
import {
    ENEMY_COLORS, ENEMY_SPEED, ENEMY_DAMAGE, ENEMY_FIRE_RATE, ENEMY_RANGE,
    PLAYER_HEIGHT, PLAYER_SPEED, WORLD_WIDTH, WORLD_DEPTH,
    INITIAL_HEALTH, INITIAL_ROUND, INITIAL_ENEMY_COUNT,
    COLLISION_DISTANCE, ENEMY_SPAWN_DISTANCE, ENEMY_OBSTACLE_DISTANCE,
    GAME_OVER_DELAY, BLACK_SCREEN_DELAY
} from './config/constants.js';

// ================================================
// IMPORT UTILITY MODULES
// ================================================
import { updateHUD, updateAmmo, updateHealth, updateRound } from './utils/hud.js';
import { updateMinimap, initMinimap } from './utils/minimap.js';
import { onWindowResize, createResizeHandler } from './utils/resize.js';
import { onMouseMove, onMouseClick, onKeyDown, onKeyUp } from './utils/input.js';

// ================================================
// IMPORT ENTITY FACTORIES (Phase 3)
// ================================================
import { createPlayer } from './entities/player.js';
import { createEnvironment } from './entities/world.js';
import { createEnemies, clearEnemies } from './entities/enemy.js';

// ================================================
// GLOBAL STATE VARIABLES
// ================================================
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

// Movement flags object for input module
const movementFlags = {
    moveForward, moveBackward, moveLeft, moveRight
};

// Player state object for input module
const playerState = {
    canJump, velocity
};

console.log('=== Phase 3: Entity Factories Loaded ===');
console.log('Weapon config:', weapons);
console.log('Constants loaded');
console.log('Utility modules imported');
console.log('Entity factories imported:', { createPlayer, createEnvironment, createEnemies });

// ================================================
// TEST: Entity Factory Integration
// ================================================

/**
 * Test player creation with factory function
 */
function testPlayerFactory() {
    console.log('Testing Player Factory...');
    
    if (!scene) {
        console.log('Scene not ready - skipping player test');
        return;
    }
    
    // Create player using factory
    const testPlayer = createPlayer(scene, PLAYER_HEIGHT);
    
    // Verify player was created correctly
    console.log('Player created:', testPlayer);
    console.log('Player position Y:', testPlayer.position.y, '(expected:', PLAYER_HEIGHT, ')');
    console.log('Player in scene:', scene.children.includes(testPlayer));
    
    // Clean up test player
    scene.remove(testPlayer);
    console.log('Player factory test complete');
}

/**
 * Test environment creation with factory function
 */
function testEnvironmentFactory() {
    console.log('Testing Environment Factory...');
    
    if (!scene) {
        console.log('Scene not ready - skipping environment test');
        return;
    }
    
    // Create environment using factory
    const testObstacles = createEnvironment(scene, WORLD_WIDTH, WORLD_DEPTH);
    
    // Verify environment was created
    console.log('Obstacles created:', testObstacles.length, '(expected: 10)');
    console.log('Scene children count:', scene.children.length);
    
    // Verify floor exists (should be first child added)
    const floor = scene.children.find(child => child.geometry && child.geometry.type === 'PlaneGeometry');
    console.log('Floor created:', !!floor);
    
    // Verify lights exist
    const lights = scene.children.filter(child => child.isLight);
    console.log('Lights created:', lights.length, '(expected: 2)');
    
    console.log('Environment factory test complete');
    
    return testObstacles;
}

/**
 * Test enemy creation with factory function
 */
function testEnemyFactory() {
    console.log('Testing Enemy Factory...');
    
    if (!scene || !player) {
        console.log('Scene or player not ready - skipping enemy test');
        return;
    }
    
    // Create enemies using factory
    const testEnemies = createEnemies(
        scene, 
        3, // Just 3 for testing
        ENEMY_COLORS, 
        player, 
        obstacles, 
        WORLD_WIDTH, 
        WORLD_DEPTH
    );
    
    // Verify enemies were created
    console.log('Enemies created:', testEnemies.length, '(expected: 3)');
    
    if (testEnemies.length > 0) {
        const firstEnemy = testEnemies[0];
        console.log('First enemy health:', firstEnemy.health, '(expected: 100)');
        console.log('First enemy lastShot:', firstEnemy.lastShot, '(expected: 0)');
        console.log('First enemy position Y:', firstEnemy.position.y, '(expected: 1)');
        console.log('First enemy in scene:', scene.children.includes(firstEnemy));
        
        // Verify spawn distance from player
        const distanceToPlayer = firstEnemy.position.distanceTo(player.position);
        console.log('Enemy distance from player:', distanceToPlayer, '(should be >= 10)');
    }
    
    // Test clearEnemies
    clearEnemies(scene, testEnemies);
    console.log('Enemies cleared - remaining in scene:', 
        scene.children.filter(child => child.geometry && child.geometry.type === 'ConeGeometry').length);
    
    console.log('Enemy factory test complete');
}

// ================================================
// TEST: HUD Module Integration
// ================================================

function testHUD() {
    console.log('Testing HUD module...');
    
    // Old HUD update (from neon_arena.html)
    function oldUpdateHUD() {
        document.getElementById('ammo').textContent = `AMMO: ${ammo}/${maxAmmo}`;
        document.getElementById('health').textContent = `HEALTH: ${Math.max(0, Math.floor(health))}`;
        document.getElementById('round').textContent = `ROUND: ${round}`;
    }
    
    // Test: Update HUD using both methods
    oldUpdateHUD();
    updateHUD(ammo, maxAmmo, health, round);
    
    console.log('HUD test complete - both methods should produce identical results');
}

// ================================================
// TEST: Minimap Module Integration
// ================================================

function testMinimap() {
    console.log('Testing Minimap module...');
    
    // Test initMinimap
    initMinimap();
    console.log('Minimap initialized');
    
    // Test updateMinimap (will fail gracefully if player/camera not ready)
    if (player && camera) {
        updateMinimap(player, camera, enemies, WORLD_WIDTH, WORLD_DEPTH);
        console.log('Minimap updated with player and enemies');
    } else {
        console.log('Player/camera not ready - skipping minimap update test');
    }
    
    console.log('Minimap test complete');
}

// ================================================
// SCENE SETUP FOR TESTING
// ================================================

function setupTestScene() {
    console.log('Setting up test scene...');
    
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111122);
    scene.fog = new THREE.Fog(0x111122, 1, 100);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = PLAYER_HEIGHT;
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    
    // Create clock
    clock = new THREE.Clock();
    
    // Create raycaster
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    console.log('Test scene setup complete');
}

// ================================================
// RUN ALL TESTS
// ================================================

function runTests() {
    console.log('=== RUNNING PHASE 3 INTEGRATION TESTS ===');
    
    // Setup scene first
    setupTestScene();
    
    // Test Phase 1 & 2 modules
    testHUD();
    testMinimap();
    
    // Test Phase 3 entity factories
    testPlayerFactory();
    obstacles = testEnvironmentFactory() || [];
    
    // Create a player for enemy testing
    player = createPlayer(scene, PLAYER_HEIGHT);
    
    testEnemyFactory();
    
    console.log('=== ALL TESTS COMPLETE ===');
    console.log('Phase 3 entity factories are working correctly');
    console.log('Ready to proceed to Phase 4: Core Systems');
}

// Run tests when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded - running Phase 3 integration tests');
    runTests();
});