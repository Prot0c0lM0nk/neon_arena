/**
 * Neon Arena FPS - Modular Version
 * Main entry point that integrates all game modules
 * 
 * INTENT: Wire all extracted modules into a functional game
 * INTENT: Maintain clean separation between game state, rendering, and input
 * INTENT: Provide a maintainable foundation for future enhancements
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
// IMPORT ENTITY FACTORIES
// ================================================
import { createPlayer } from './entities/player.js';
import { createEnvironment } from './entities/world.js';
import { createDroids, clearDroids } from './entities/droid.js';

// ================================================
// IMPORT EFFECTS
// ================================================
import { initVisor, onPlayerHit, resetVisor, updateVisor } from './effects/visor.js';

// ================================================
// IMPORT CORE SYSTEMS
// ================================================
import { setupScene, createAnimationLoop, handleResize } from './core/engine.js';
import { startGame as startGameLogic, gameOver as gameOverLogic, nextRound as nextRoundLogic, fireWeapon as fireWeaponLogic, reloadWeapon } from './core/game.js';
import { updatePlayer, updateEnemies, updateBullets } from './core/update.js';
// ================================================
// GAME STATE
// ================================================
const gameState = {
    // Three.js core objects
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    clock: null,
    raycaster: null,
    mouse: null,
    
    // Game entities
    player: null,
    enemies: [],
    bullets: [],
    enemyBullets: [],
    obstacles: [],
    
    // Player state
    weaponType: 'rifle',
    ammo: 0,
    maxAmmo: 0,
    health: 100,
    
    // Game progression
    round: 1,
    enemiesInRound: 5,
    gameStarted: false,
    lastFireTime: 0,
    
    // Movement state
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    canJump: false,
    velocity: new THREE.Vector3()
};

// ================================================
// INITIALIZATION
// ================================================

function init() {
    console.log('=== Neon Arena FPS - Modular Version ===');
    
    // Set up event listeners
    setupEventListeners();
    
    // Set up the scene
    const container = document.getElementById('gameContainer');
    const sceneSetup = setupScene(container, PLAYER_HEIGHT);
    
    // Store scene references
    gameState.scene = sceneSetup.scene;
    gameState.camera = sceneSetup.camera;
    gameState.renderer = sceneSetup.renderer;
    gameState.controls = sceneSetup.controls;
    gameState.clock = sceneSetup.clock;
    gameState.raycaster = sceneSetup.raycaster;
    gameState.mouse = sceneSetup.mouse;
    
    // Create player
    gameState.player = createPlayer(gameState.scene, PLAYER_HEIGHT);
    
    // Create environment
    gameState.obstacles = createEnvironment(gameState.scene, WORLD_WIDTH, WORLD_DEPTH);
    
    // Initialize minimap
    initMinimap();
    
    // Initialize visor effects
    initVisor();
    
    // Handle window resize
    window.addEventListener('resize', () => handleResize(gameState.camera, gameState.renderer), false);
    
    // Start animation loop
    const animate = createAnimationLoop({
        clock: gameState.clock,
        renderer: gameState.renderer,
        scene: gameState.scene,
        camera: gameState.camera,
        updateCallback: updateGame,
        gameStartedCheck: () => gameState.gameStarted
    });
    
    animate();
    
    console.log('Game initialized successfully');
}

// ================================================
// EVENT LISTENERS
// ================================================

function setupEventListeners() {
    // Weapon selection
    document.querySelectorAll('.weapon-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.weapon-card').forEach(c => c.style.borderColor = '#00ffea');
            card.style.borderColor = '#ff00ff';
            gameState.weaponType = card.dataset.weapon;
        });
    });
    
    // Start button
    document.getElementById('startButton').addEventListener('click', startGame);
    
    // Mouse and keyboard
    document.addEventListener('mousemove', (e) => onMouseMove(e, gameState.gameStarted, gameState.mouse), false);
    document.addEventListener('click', (e) => {
        if (gameState.gameStarted) fireWeapon();
    }, false);
    document.addEventListener('keydown', onKeyDownHandler, false);
    document.addEventListener('keyup', onKeyUpHandler, false);
}

// ================================================
// INPUT HANDLERS
// ================================================

function onKeyDownHandler(event) {
    if (!gameState.gameStarted) return;
    
    switch (event.keyCode) {
        case 87: // W
            gameState.moveForward = true;
            break;
        case 83: // S
            gameState.moveBackward = true;
            break;
        case 65: // A
            gameState.moveLeft = true;
            break;
        case 68: // D
            gameState.moveRight = true;
            break;
        case 32: // Space
            if (gameState.canJump) {
                gameState.velocity.y = 0.2;
                gameState.canJump = false;
            }
            break;
        case 82: // R (reload)
            gameState.ammo = reloadWeapon(
                gameState.weaponType,
                weapons,
                gameState.ammo,
                (ammo, maxAmmo) => updateHUD(ammo, maxAmmo, gameState.health, gameState.round)
            );
            break;
    }
}

function onKeyUpHandler(event) {
    if (!gameState.gameStarted) return;
    
    switch (event.keyCode) {
        case 87: // W
            gameState.moveForward = false;
            break;
        case 83: // S
            gameState.moveBackward = false;
            break;
        case 65: // A
            gameState.moveLeft = false;
            break;
        case 68: // D
            gameState.moveRight = false;
            break;
    }
}

// ================================================
// GAME FLOW FUNCTIONS
// ================================================

function startGame() {
    console.log('Starting game with weapon:', gameState.weaponType);
    
    // Hide start screen, show game
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    
    // Initialize game state
    const weapon = weapons[gameState.weaponType];
    gameState.ammo = weapon.ammo;
    gameState.maxAmmo = weapon.maxAmmo;
    gameState.health = 100;
    gameState.round = 1;
    gameState.enemiesInRound = 5;
    gameState.gameStarted = true;
    
    // Clear any existing enemies and reset visor
    clearDroids(gameState.scene, gameState.enemies);
    gameState.enemies = [];
    resetVisor();
    
    // Spawn first round enemies
    spawnEnemies(gameState.enemiesInRound);
    
    // Update HUD and visor
    updateHUD(gameState.ammo, gameState.maxAmmo, gameState.health, gameState.round);
    updateVisor(gameState.health);
    
    // Lock pointer
    const element = document.body;
    element.requestPointerLock = element.requestPointerLock || 
                               element.mozRequestPointerLock || 
                               element.webkitRequestPointerLock;
    element.requestPointerLock();
    gameState.controls.lock();
}

function gameOver() {
    gameState.gameStarted = false;
    
    // Show game over text
    document.getElementById('gameOver').style.display = 'block';
    
    // Release pointer lock
    document.exitPointerLock = document.exitPointerLock || 
                             document.mozExitPointerLock || 
                             document.webkitExitPointerLock;
    document.exitPointerLock();
    
    // Transition sequence
    setTimeout(() => {
        document.getElementById('blackScreen').style.display = 'block';
        
        setTimeout(() => {
            document.getElementById('blackScreen').style.display = 'none';
            document.getElementById('gameOver').style.display = 'none';
            document.getElementById('gameContainer').style.display = 'none';
            document.getElementById('startScreen').style.display = 'flex';
            
            // Reset camera
            gameState.camera.rotation.set(0, 0, 0);
            gameState.camera.position.y = PLAYER_HEIGHT;
            
            // Clear enemies
            clearDroids(gameState.scene, gameState.enemies);
            gameState.enemies = [];
            resetVisor();
        }, 2000);
    }, 2000);
}

function nextRound() {
    gameState.round++;
    gameState.enemiesInRound = 5 + Math.floor(gameState.round * 1.5);
    
    spawnEnemies(gameState.enemiesInRound);
    updateHUD(gameState.ammo, gameState.maxAmmo, gameState.health, gameState.round);
}

function spawnEnemies(count) {
    const newDroids = createDroids(
        gameState.scene,
        count,
        ENEMY_COLORS,
        gameState.player,
        gameState.obstacles,
        WORLD_WIDTH,
        WORLD_DEPTH
    );
    gameState.enemies.push(...newDroids);
}

// ================================================
// WEAPON FUNCTIONS
// ================================================

function fireWeapon() {
    const result = fireWeaponLogic({
        weaponType: gameState.weaponType,
        weapons: weapons,
        ammo: gameState.ammo,
        lastFireTime: gameState.lastFireTime,
        camera: gameState.camera,
        scene: gameState.scene,
        bullets: gameState.bullets,
        updateHUD: (ammo, maxAmmo) => updateHUD(ammo, maxAmmo, gameState.health, gameState.round)
    });
    
    gameState.ammo = result.ammo;
    gameState.lastFireTime = result.lastFireTime;
}

// ================================================
// GAME UPDATE LOOP
// ================================================

function updateGame(delta) {
    // Update player
    updatePlayer(
        delta,
        gameState.player,
        gameState.camera,
        {
            moveForward: gameState.moveForward,
            moveBackward: gameState.moveBackward,
            moveLeft: gameState.moveLeft,
            moveRight: gameState.moveRight
        },
        PLAYER_SPEED,
        { velocity: gameState.velocity, canJump: gameState.canJump },
        PLAYER_HEIGHT,
        gameState.obstacles,
        gameState.raycaster,
        WORLD_WIDTH,
        WORLD_DEPTH
    );
    
    // Update enemies
    updateEnemies(
        delta,
        gameState.enemies,
        gameState.player,
        gameState.obstacles,
        ENEMY_SPEED,
        ENEMY_RANGE,
        ENEMY_FIRE_RATE,
        ENEMY_DAMAGE,
        gameState.scene,
        gameState.enemyBullets,
        gameState.raycaster,
        WORLD_WIDTH,
        WORLD_DEPTH
    );
    
    // Update bullets
    updateBullets(
        gameState.bullets,
        gameState.enemyBullets,
        gameState.enemies,
        gameState.player,
        gameState.obstacles,
        gameState.scene,
        gameState.raycaster,
        (ammo, maxAmmo, health, round) => {
            if (health !== null) gameState.health = health;
            updateHUD(gameState.ammo, gameState.maxAmmo, gameState.health, gameState.round);
        },
        () => {
            // Enemy killed - check for round complete
            if (gameState.enemies.length === 0) {
                nextRound();
            }
        },
        (damage) => {
            // Player hit
            gameState.health -= damage;
            updateHUD(gameState.ammo, gameState.maxAmmo, gameState.health, gameState.round);
            onPlayerHit(damage, gameState.health);
            
            if (gameState.health <= 0) {
                gameOver();
            }
        },
        () => gameOver()
    );
    
    // Update minimap
    updateMinimap(gameState.player, gameState.camera, gameState.enemies, WORLD_WIDTH, WORLD_DEPTH);
}

// ================================================
// START THE GAME
// ================================================

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);