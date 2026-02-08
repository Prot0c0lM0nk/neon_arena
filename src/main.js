/**
 * Neon Arena FPS - Tactical HUD + Telemetry Foundation
 */

import { weapons } from './config/weapons.js';
import {
    ENEMY_COLORS, ENEMY_SPEED, ENEMY_DAMAGE, ENEMY_FIRE_RATE, ENEMY_RANGE,
    PLAYER_HEIGHT, PLAYER_SPEED, WORLD_WIDTH, WORLD_DEPTH
} from './config/constants.js';
import {
    initHUD,
    updateHUDCore,
    updateStealthHUD,
    setHUDObjective
} from './utils/hud.js';
import { updateMinimap, initMinimap } from './utils/minimap.js';
import { createPlayer } from './entities/player.js';
import { createEnvironment, clearEnvironment } from './entities/world.js';
import { createDroids, clearDroids } from './entities/droid.js';
import {
    spawnRoundPickups,
    updatePickups,
    tryCollectPickups,
    clearPickups
} from './entities/pickups.js';
import { initVisor, onPlayerHit, resetVisor, updateVisor } from './effects/visor.js';
import {
    initViewmodelSprite,
    setViewmodelVisible,
    setViewmodelWeapon,
    updateViewmodelSprite,
    applyViewmodelRecoil
} from './effects/viewmodel-sprite.js';
import { setupScene, createAnimationLoop, handleResize } from './core/engine.js';
import { fireWeapon as fireWeaponLogic, reloadWeapon } from './core/game.js';
import { updatePlayer, updateEnemies, updateBullets } from './core/update.js';
import { computeLightTelemetry, computeSoundTelemetry } from './core/telemetry.js';
import { getLevelConfig } from './config/levels.js';
import {
    showCountdown,
    showRoundBanner,
    showIntermissionTimer,
    setCrosshairVisible,
    showPickupNotice
} from './utils/phase-ui.js';
import { log, CATEGORIES, LEVELS } from './utils/logger.js';

const PHASES = {
    IDLE: 'IDLE',
    PREP_COUNTDOWN: 'PREP_COUNTDOWN',
    COMBAT: 'COMBAT',
    INTERMISSION: 'INTERMISSION',
    ROUND_END: 'ROUND_END',
    ARENA_GATE_OPEN: 'ARENA_GATE_OPEN',
    ARENA_SWAP: 'ARENA_SWAP'
};

const ROUND_COUNTDOWN_SECONDS = 3;
const INTERMISSION_SECONDS = 8;
const COMBAT_ACTIVATION_DELAY = 1;
const ROUND_END_SECONDS = 1.2;
const ARENA_GATE_OPEN_SECONDS = 1.4;
const ARENA_SWAP_SECONDS = 1.0;
const HEAL_AMOUNT = 35;
const START_UNLOCKED_WEAPONS = new Set(['rifle']);

const gameState = {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    clock: null,
    raycaster: null,
    mouse: null,

    player: null,
    enemies: [],
    bullets: [],
    enemyBullets: [],
    obstacles: [],
    activePickups: [],
    mapMeta: null,
    environmentObjects: [],

    weaponType: 'rifle',
    ammo: 0,
    maxAmmo: 0,
    weaponAmmo: {
        rifle: weapons.rifle.maxAmmo,
        shotgun: weapons.shotgun.maxAmmo,
        sniper: weapons.sniper.maxAmmo
    },
    unlockedWeapons: new Set(['rifle']),

    health: 100,
    round: 1,
    roundInFloor: 1,
    floor: 1,
    levelConfig: getLevelConfig(1),
    enemiesInRound: 5,
    gameStarted: false,
    lastFireTime: 0,

    phase: PHASES.IDLE,
    phaseTimer: 0,
    countdownValue: null,
    combatLive: false,

    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    isCrouching: false,
    movementMagnitude: 0,
    playerMotion: {
        velocityY: 0,
        canJump: true,
        jumpQueued: false
    },

    telemetry: {
        light: 0,
        sound: 0,
        firedTimer: 0,
        jumpTimer: 0,
        landTimer: 0
    }
};

function getEnemiesForRound(globalRound, floor) {
    return 5 + Math.floor(globalRound * 1.5) + Math.floor((floor - 1) * 0.8);
}

function clearBulletArray(bullets) {
    bullets.forEach(bullet => gameState.scene.remove(bullet.mesh));
    bullets.length = 0;
}

function closeSafeGate() {
    const gate = gameState.mapMeta?.safeRoom?.gate;
    if (!gate) return;
    gate.mesh.position.y = gate.closedY;
    gate.mesh.userData.solid = true;
    gate.isOpen = false;
}

function openSafeGate() {
    const gate = gameState.mapMeta?.safeRoom?.gate;
    if (!gate) return;
    gate.mesh.position.y = gate.openY;
    gate.mesh.userData.solid = false;
    gate.isOpen = true;
}

function resetPlayerToSpawn() {
    const spawn = gameState.mapMeta.playerSpawn;
    gameState.player.position.set(spawn.x, spawn.y, spawn.z);
    gameState.camera.position.copy(gameState.player.position);
    gameState.playerMotion.velocityY = 0;
    gameState.playerMotion.canJump = true;
    gameState.playerMotion.jumpQueued = false;
    gameState.camera.rotation.set(0, 0, 0);
}

function loadArenaForFloor(floor) {
    gameState.levelConfig = getLevelConfig(floor);

    if (gameState.environmentObjects.length > 0) {
        clearEnvironment(gameState.scene, gameState.environmentObjects);
        gameState.environmentObjects = [];
    }

    const worldSetup = createEnvironment(
        gameState.scene,
        WORLD_WIDTH,
        WORLD_DEPTH,
        gameState.levelConfig.arenaId
    );

    gameState.obstacles = worldSetup.obstacles;
    gameState.mapMeta = worldSetup.mapMeta;
    gameState.environmentObjects = worldSetup.environmentObjects;

    closeSafeGate();
    resetPlayerToSpawn();
}

function updateHudCoreState() {
    updateHUDCore({
        health: gameState.health,
        healthMax: 100,
        ammo: gameState.ammo,
        ammoMax: gameState.maxAmmo,
        round: gameState.roundInFloor,
        floor: gameState.floor,
        weaponType: gameState.weaponType,
        isMelee: false
    });
}

function syncWeaponCardLocks() {
    const allowed = START_UNLOCKED_WEAPONS;
    document.querySelectorAll('.weapon-card').forEach(card => {
        const weapon = card.dataset.weapon;
        const locked = !allowed.has(weapon);
        card.dataset.locked = locked ? 'true' : 'false';
        card.classList.toggle('locked', locked);

        let label = card.querySelector('.lock-label');
        if (locked && !label) {
            label = document.createElement('div');
            label.className = 'lock-label';
            label.textContent = 'Locked';
            card.insertBefore(label, card.querySelector('.weapon-stats'));
        }
        if (!locked && label) {
            label.remove();
        }
    });
}

function highlightSelectedWeaponCard(weaponType) {
    document.querySelectorAll('.weapon-card').forEach(card => {
        const isLocked = card.dataset.locked === 'true';
        if (isLocked) {
            card.style.borderColor = '#666';
            return;
        }
        card.style.borderColor = card.dataset.weapon === weaponType ? '#ff00ff' : '#1de8de';
    });
}

function spawnEnemies(count) {
    clearDroids(gameState.scene, gameState.enemies);
    gameState.enemies = createDroids(
        gameState.scene,
        count,
        ENEMY_COLORS,
        gameState.mapMeta,
        gameState.round
    );

    const healthScale = gameState.levelConfig.enemyScaling.health;
    gameState.enemies.forEach(enemy => {
        enemy.health = Math.max(25, Math.round(enemy.health * healthScale));
    });
}

function setPhase(phase, timer = 0) {
    gameState.phase = phase;
    gameState.phaseTimer = timer;

    log(CATEGORIES.PHASE, LEVELS.INFO, 'Phase entered', {
        phase,
        timer: timer.toFixed ? timer.toFixed(2) : timer
    });
}

function setObjectiveForCombatLoop() {
    setHUDObjective(
        `Clear Round ${gameState.roundInFloor}/${gameState.levelConfig.roundsPerArena} to advance`
    );
}

function enterPrepCountdown(showRoundText = true) {
    setPhase(PHASES.PREP_COUNTDOWN, ROUND_COUNTDOWN_SECONDS);
    gameState.combatLive = false;
    gameState.countdownValue = ROUND_COUNTDOWN_SECONDS;
    closeSafeGate();
    showIntermissionTimer(null);
    showCountdown(gameState.countdownValue);
    setCrosshairVisible(false);
    setViewmodelVisible(true);
    setObjectiveForCombatLoop();

    if (showRoundText) {
        showRoundBanner(`FLOOR ${gameState.floor} · ROUND ${gameState.roundInFloor}`, 1200);
    }
}

function enterCombatActivation() {
    setPhase(PHASES.COMBAT, COMBAT_ACTIVATION_DELAY);
    gameState.combatLive = false;
    openSafeGate();
    showCountdown('GO!');
    setCrosshairVisible(true);
    setHUDObjective('Engage hostiles and control noise/exposure');
}

function activateCombat() {
    if (gameState.combatLive) return;

    gameState.combatLive = true;
    gameState.phaseTimer = 0;
    clearPickups(gameState.scene, gameState.activePickups);
    showCountdown(null);
    setCrosshairVisible(true);
    setHUDObjective('Combat active');

    log(CATEGORIES.PHASE, LEVELS.INFO, 'Combat live');
}

function enterIntermission() {
    setPhase(PHASES.INTERMISSION, INTERMISSION_SECONDS);
    gameState.combatLive = false;

    clearBulletArray(gameState.enemyBullets);
    spawnRoundPickups({
        scene: gameState.scene,
        pickups: gameState.activePickups,
        round: gameState.round,
        unlockedWeapons: gameState.unlockedWeapons,
        pickupNodes: gameState.mapMeta.pickupNodes
    });

    if (gameState.activePickups.length > 0) {
        const pickupNames = gameState.activePickups
            .map(p => p.type.replace('unlock_', '').toUpperCase())
            .join(' + ');
        showPickupNotice(`Intermission: collect ${pickupNames}`, 2400);
    }

    showIntermissionTimer(INTERMISSION_SECONDS);
    showRoundBanner('INTERMISSION', 1000);
    setHUDObjective('Recover, collect unlocks, then re-enter arena');
}

function enterRoundEnd() {
    setPhase(PHASES.ROUND_END, ROUND_END_SECONDS);
    gameState.combatLive = false;
    clearPickups(gameState.scene, gameState.activePickups);
    clearBulletArray(gameState.enemyBullets);
    showRoundBanner('ARENA CLEAR', 1400);
    setHUDObjective('Gate opening... prepare to transition');
}

function enterArenaGateOpen() {
    setPhase(PHASES.ARENA_GATE_OPEN, ARENA_GATE_OPEN_SECONDS);
    openSafeGate();
    showRoundBanner('GATE OPEN', 900);
    setHUDObjective(`Advancing to Floor ${gameState.floor + 1}`);
}

function enterArenaSwap() {
    setPhase(PHASES.ARENA_SWAP, ARENA_SWAP_SECONDS);
    showRoundBanner('SWAPPING ARENA', 900);
    setHUDObjective(`Loading Floor ${gameState.floor + 1} arena...`);
}

function advanceToNextFloor() {
    gameState.floor += 1;
    gameState.round += 1;
    gameState.roundInFloor = 1;
    gameState.enemiesInRound = getEnemiesForRound(gameState.round, gameState.floor);

    clearDroids(gameState.scene, gameState.enemies);
    gameState.enemies = [];
    clearBulletArray(gameState.bullets);
    clearBulletArray(gameState.enemyBullets);

    loadArenaForFloor(gameState.floor);
    spawnEnemies(gameState.enemiesInRound);
    updateHudCoreState();
    enterPrepCountdown(true);
}

function startNextRound() {
    gameState.round += 1;
    gameState.roundInFloor += 1;
    gameState.enemiesInRound = getEnemiesForRound(gameState.round, gameState.floor);

    spawnEnemies(gameState.enemiesInRound);
    updateHudCoreState();
    enterPrepCountdown(true);
}

function applyPickup(type) {
    if (type === 'health') {
        const oldHealth = gameState.health;
        gameState.health = Math.min(100, gameState.health + HEAL_AMOUNT);
        const delta = gameState.health - oldHealth;
        updateHudCoreState();
        updateVisor(gameState.health);
        showPickupNotice(`Healing applied +${delta}`);
        log(CATEGORIES.PICKUP, LEVELS.INFO, 'Health restored', { oldHealth, newHealth: gameState.health });
        return;
    }

    if (type === 'unlock_shotgun' && !gameState.unlockedWeapons.has('shotgun')) {
        gameState.unlockedWeapons.add('shotgun');
        showPickupNotice('Shotgun unlocked (Key 2)');
        log(CATEGORIES.PROGRESSION, LEVELS.INFO, 'Weapon unlocked', { weapon: 'shotgun', round: gameState.round });
        return;
    }

    if (type === 'unlock_sniper' && !gameState.unlockedWeapons.has('sniper')) {
        gameState.unlockedWeapons.add('sniper');
        showPickupNotice('Sniper unlocked (Key 3)');
        log(CATEGORIES.PROGRESSION, LEVELS.INFO, 'Weapon unlocked', { weapon: 'sniper', round: gameState.round });
    }
}

function attemptWeaponSwitch(weaponType) {
    if (!gameState.unlockedWeapons.has(weaponType)) {
        showPickupNotice('Weapon locked. Collect unlock token.');
        log(CATEGORIES.PROGRESSION, LEVELS.INFO, 'Locked weapon switch blocked', { weapon: weaponType });
        return;
    }

    if (gameState.weaponType === weaponType) {
        return;
    }

    gameState.weaponType = weaponType;
    gameState.maxAmmo = weapons[weaponType].maxAmmo;
    gameState.ammo = gameState.weaponAmmo[weaponType];
    setViewmodelWeapon(gameState.weaponType);

    updateHudCoreState();
    showPickupNotice(`Switched to ${weaponType.toUpperCase()}`);
    log(CATEGORIES.WEAPON, LEVELS.INFO, 'Weapon switched', { weapon: weaponType });
}

function fireWeapon() {
    if (!gameState.gameStarted || gameState.phase !== PHASES.COMBAT || !gameState.combatLive) return;

    const previousAmmo = gameState.ammo;
    const result = fireWeaponLogic({
        weaponType: gameState.weaponType,
        weapons,
        ammo: gameState.ammo,
        lastFireTime: gameState.lastFireTime,
        camera: gameState.camera,
        scene: gameState.scene,
        bullets: gameState.bullets,
        updateHUD: () => updateHudCoreState()
    });

    gameState.ammo = result.ammo;
    gameState.lastFireTime = result.lastFireTime;
    gameState.weaponAmmo[gameState.weaponType] = gameState.ammo;

    if (result.ammo < previousAmmo) {
        gameState.telemetry.firedTimer = 0.24;
        applyViewmodelRecoil(1);
    }

    updateHudCoreState();
}

function reloadCurrentWeapon() {
    gameState.ammo = reloadWeapon(
        gameState.weaponType,
        weapons,
        gameState.ammo,
        () => updateHudCoreState()
    );

    gameState.weaponAmmo[gameState.weaponType] = gameState.ammo;
    updateHudCoreState();
}

function resetTelemetry() {
    gameState.telemetry.light = 0;
    gameState.telemetry.sound = 0;
    gameState.telemetry.firedTimer = 0;
    gameState.telemetry.jumpTimer = 0;
    gameState.telemetry.landTimer = 0;
    updateStealthHUD({ light: 0, sound: 0 });
}

function startGame() {
    syncWeaponCardLocks();
    if (!START_UNLOCKED_WEAPONS.has(gameState.weaponType)) {
        gameState.weaponType = 'rifle';
    }

    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('blackScreen').style.display = 'none';

    gameState.gameStarted = true;
    gameState.floor = 1;
    gameState.round = 1;
    gameState.roundInFloor = 1;
    gameState.levelConfig = getLevelConfig(1);
    gameState.enemiesInRound = getEnemiesForRound(gameState.round, gameState.floor);
    gameState.health = 100;
    gameState.unlockedWeapons = new Set(['rifle']);
    gameState.weaponAmmo = {
        rifle: weapons.rifle.maxAmmo,
        shotgun: weapons.shotgun.maxAmmo,
        sniper: weapons.sniper.maxAmmo
    };
    gameState.maxAmmo = weapons[gameState.weaponType].maxAmmo;
    gameState.ammo = gameState.weaponAmmo[gameState.weaponType];
    gameState.lastFireTime = 0;

    clearDroids(gameState.scene, gameState.enemies);
    gameState.enemies = [];
    clearBulletArray(gameState.bullets);
    clearBulletArray(gameState.enemyBullets);
    clearPickups(gameState.scene, gameState.activePickups);
    resetVisor();
    resetTelemetry();

    loadArenaForFloor(gameState.floor);
    spawnEnemies(gameState.enemiesInRound);
    updateHudCoreState();
    updateVisor(gameState.health);

    setViewmodelWeapon(gameState.weaponType);
    setViewmodelVisible(true);

    enterPrepCountdown(true);

    document.body.requestPointerLock =
        document.body.requestPointerLock ||
        document.body.mozRequestPointerLock ||
        document.body.webkitRequestPointerLock;
    document.body.requestPointerLock();
    gameState.controls.lock();
}

function gameOver() {
    if (!gameState.gameStarted) return;

    gameState.gameStarted = false;
    gameState.phase = PHASES.IDLE;
    gameState.combatLive = false;
    setCrosshairVisible(false);
    setViewmodelVisible(false);
    showCountdown(null);
    showIntermissionTimer(null);
    setHUDObjective('');
    clearPickups(gameState.scene, gameState.activePickups);
    clearBulletArray(gameState.bullets);
    clearBulletArray(gameState.enemyBullets);
    closeSafeGate();

    document.getElementById('gameOver').style.display = 'block';
    document.exitPointerLock =
        document.exitPointerLock ||
        document.mozExitPointerLock ||
        document.webkitExitPointerLock;
    document.exitPointerLock();

    setTimeout(() => {
        document.getElementById('blackScreen').style.display = 'block';

        setTimeout(() => {
            document.getElementById('blackScreen').style.display = 'none';
            document.getElementById('gameOver').style.display = 'none';
            document.getElementById('gameContainer').style.display = 'none';
            document.getElementById('startScreen').style.display = 'flex';

            clearDroids(gameState.scene, gameState.enemies);
            gameState.enemies = [];
            gameState.unlockedWeapons = new Set(['rifle']);
            gameState.weaponType = 'rifle';
            highlightSelectedWeaponCard('rifle');
            syncWeaponCardLocks();
            resetPlayerToSpawn();
            resetVisor();
            resetTelemetry();
        }, 2000);
    }, 2000);
}

function updatePhase(delta) {
    if (gameState.phase === PHASES.PREP_COUNTDOWN) {
        gameState.phaseTimer -= delta;
        const nextCount = Math.ceil(Math.max(0, gameState.phaseTimer));

        if (gameState.phaseTimer > 0 && nextCount !== gameState.countdownValue) {
            gameState.countdownValue = nextCount;
            showCountdown(nextCount);
        }

        if (gameState.phaseTimer <= 0) {
            enterCombatActivation();
        }
        return;
    }

    if (gameState.phase === PHASES.COMBAT) {
        if (!gameState.combatLive) {
            gameState.phaseTimer -= delta;
            if (gameState.phaseTimer <= 0) {
                activateCombat();
            }
            return;
        }

        if (gameState.enemies.length === 0) {
            if (gameState.roundInFloor >= gameState.levelConfig.roundsPerArena) {
                enterRoundEnd();
            } else {
                enterIntermission();
            }
        }
        return;
    }

    if (gameState.phase === PHASES.INTERMISSION) {
        gameState.phaseTimer -= delta;
        showIntermissionTimer(gameState.phaseTimer);

        if (gameState.phaseTimer <= 0) {
            showIntermissionTimer(null);
            startNextRound();
        }
        return;
    }

    if (gameState.phase === PHASES.ROUND_END) {
        gameState.phaseTimer -= delta;
        if (gameState.phaseTimer <= 0) {
            enterArenaGateOpen();
        }
        return;
    }

    if (gameState.phase === PHASES.ARENA_GATE_OPEN) {
        gameState.phaseTimer -= delta;
        if (gameState.phaseTimer <= 0) {
            enterArenaSwap();
        }
        return;
    }

    if (gameState.phase === PHASES.ARENA_SWAP) {
        gameState.phaseTimer -= delta;
        if (gameState.phaseTimer <= 0) {
            advanceToNextFloor();
        }
    }
}

function tickTelemetry(delta) {
    gameState.telemetry.firedTimer = Math.max(0, gameState.telemetry.firedTimer - delta);
    gameState.telemetry.jumpTimer = Math.max(0, gameState.telemetry.jumpTimer - delta);
    gameState.telemetry.landTimer = Math.max(0, gameState.telemetry.landTimer - delta);

    const firedImpulse = gameState.telemetry.firedTimer > 0
        ? 42 * (gameState.telemetry.firedTimer / 0.24)
        : 0;
    const jumpImpulse = gameState.telemetry.jumpTimer > 0
        ? 20 * (gameState.telemetry.jumpTimer / 0.34)
        : 0;
    const landImpulse = gameState.telemetry.landTimer > 0
        ? 24 * (gameState.telemetry.landTimer / 0.25)
        : 0;

    gameState.telemetry.sound = computeSoundTelemetry({
        current: gameState.telemetry.sound,
        movementMagnitude: gameState.movementMagnitude,
        isCrouching: gameState.isCrouching,
        impulse: firedImpulse + jumpImpulse + landImpulse
    }, delta);

    gameState.telemetry.light = computeLightTelemetry({
        player: gameState.player,
        mapMeta: gameState.mapMeta,
        obstacles: gameState.obstacles,
        raycaster: gameState.raycaster,
        isCrouching: gameState.isCrouching
    });

    updateStealthHUD({
        light: gameState.telemetry.light,
        sound: gameState.telemetry.sound
    });
}

function onKeyDownHandler(event) {
    if (!gameState.gameStarted) return;

    switch (event.code) {
        case 'KeyW':
            gameState.moveForward = true;
            break;
        case 'KeyS':
            gameState.moveBackward = true;
            break;
        case 'KeyA':
            gameState.moveLeft = true;
            break;
        case 'KeyD':
            gameState.moveRight = true;
            break;
        case 'Space':
            gameState.playerMotion.jumpQueued = true;
            break;
        case 'KeyR':
            reloadCurrentWeapon();
            break;
        case 'ControlLeft':
        case 'KeyC':
            gameState.isCrouching = true;
            break;
        case 'Digit1':
            attemptWeaponSwitch('rifle');
            break;
        case 'Digit2':
            attemptWeaponSwitch('shotgun');
            break;
        case 'Digit3':
            attemptWeaponSwitch('sniper');
            break;
    }
}

function onKeyUpHandler(event) {
    if (!gameState.gameStarted) return;

    switch (event.code) {
        case 'KeyW':
            gameState.moveForward = false;
            break;
        case 'KeyS':
            gameState.moveBackward = false;
            break;
        case 'KeyA':
            gameState.moveLeft = false;
            break;
        case 'KeyD':
            gameState.moveRight = false;
            break;
        case 'ControlLeft':
        case 'KeyC':
            gameState.isCrouching = false;
            break;
    }
}

function setupEventListeners() {
    document.querySelectorAll('.weapon-card').forEach(card => {
        card.addEventListener('click', () => {
            if (card.dataset.locked === 'true') {
                return;
            }
            gameState.weaponType = card.dataset.weapon;
            highlightSelectedWeaponCard(gameState.weaponType);
        });
    });

    document.getElementById('startButton').addEventListener('click', startGame);
    document.addEventListener('click', () => fireWeapon(), false);
    document.addEventListener('keydown', onKeyDownHandler, false);
    document.addEventListener('keyup', onKeyUpHandler, false);
    window.addEventListener('resize', () => handleResize(gameState.camera, gameState.renderer), false);
}

function updateGame(delta) {
    updatePhase(delta);

    const oldPosition = gameState.player.position.clone();
    const wasGrounded = gameState.playerMotion.canJump;

    updatePlayer(
        delta,
        gameState.player,
        gameState.camera,
        {
            moveForward: gameState.moveForward,
            moveBackward: gameState.moveBackward,
            moveLeft: gameState.moveLeft,
            moveRight: gameState.moveRight,
            isCrouching: gameState.isCrouching
        },
        {
            speed: PLAYER_SPEED,
            crouchSpeed: PLAYER_SPEED * 0.55,
            standHeight: PLAYER_HEIGHT,
            crouchHeight: PLAYER_HEIGHT * 0.7,
            jumpVelocity: 0.22,
            gravity: 0.012
        },
        gameState.playerMotion,
        gameState.obstacles,
        gameState.raycaster,
        gameState.mapMeta.worldBounds
    );

    const nowGrounded = gameState.playerMotion.canJump;
    if (wasGrounded && !nowGrounded) {
        gameState.telemetry.jumpTimer = 0.34;
    } else if (!wasGrounded && nowGrounded) {
        gameState.telemetry.landTimer = 0.25;
    }

    const movedDistance = new THREE.Vector2(
        gameState.player.position.x - oldPosition.x,
        gameState.player.position.z - oldPosition.z
    ).length();
    const expectedStep = Math.max(0.0001, PLAYER_SPEED * delta * 60);
    gameState.movementMagnitude = Math.max(0, Math.min(1, movedDistance / expectedStep));

    updateEnemies(
        delta,
        gameState.enemies,
        gameState.player,
        gameState.obstacles,
        {
            speed: ENEMY_SPEED * gameState.levelConfig.enemyScaling.speed,
            range: ENEMY_RANGE,
            fireRate: ENEMY_FIRE_RATE,
            damage: ENEMY_DAMAGE * gameState.levelConfig.enemyScaling.damage
        },
        gameState.scene,
        gameState.enemyBullets,
        gameState.raycaster,
        gameState.mapMeta,
        gameState.phase === PHASES.COMBAT && gameState.combatLive
    );

    updateBullets(
        gameState.bullets,
        gameState.enemyBullets,
        gameState.enemies,
        gameState.player,
        gameState.obstacles,
        gameState.scene,
        gameState.raycaster,
        () => {},
        () => {
            if (gameState.phase === PHASES.COMBAT && gameState.combatLive && gameState.enemies.length === 0) {
                if (gameState.roundInFloor >= gameState.levelConfig.roundsPerArena) {
                    enterRoundEnd();
                } else {
                    enterIntermission();
                }
            }
        },
        damage => {
            gameState.health -= damage;
            updateHudCoreState();
            onPlayerHit(damage, gameState.health);
            updateVisor(gameState.health);
            if (gameState.health <= 0) {
                gameOver();
            }
        }
    );

    updatePickups(gameState.activePickups, delta);

    if (gameState.phase === PHASES.INTERMISSION || gameState.phase === PHASES.PREP_COUNTDOWN) {
        tryCollectPickups({
            player: gameState.player,
            pickups: gameState.activePickups,
            scene: gameState.scene,
            onCollect: applyPickup
        });
    }

    tickTelemetry(delta);
    updateViewmodelSprite({
        delta,
        movementIntensity: gameState.movementMagnitude,
        isCrouching: gameState.isCrouching
    });

    updateMinimap(gameState.player, gameState.camera, gameState.enemies, WORLD_WIDTH, WORLD_DEPTH);
}

function init() {
    log(CATEGORIES.SYSTEM, LEVELS.INFO, '=== Neon Arena FPS - Tactical HUD Telemetry Build ===');

    initHUD();
    syncWeaponCardLocks();
    highlightSelectedWeaponCard('rifle');
    setCrosshairVisible(false);
    showCountdown(null);
    showIntermissionTimer(null);
    setHUDObjective('');

    setupEventListeners();

    const container = document.getElementById('gameContainer');
    const sceneSetup = setupScene(container, PLAYER_HEIGHT);
    gameState.scene = sceneSetup.scene;
    gameState.camera = sceneSetup.camera;
    gameState.renderer = sceneSetup.renderer;
    gameState.controls = sceneSetup.controls;
    gameState.clock = sceneSetup.clock;
    gameState.raycaster = sceneSetup.raycaster;
    gameState.mouse = sceneSetup.mouse;

    gameState.player = createPlayer(gameState.scene, PLAYER_HEIGHT);

    loadArenaForFloor(1);
    initMinimap();
    initVisor();
    initViewmodelSprite();
    setViewmodelVisible(false);

    updateHudCoreState();
    updateStealthHUD({ light: 0, sound: 0 });

    const animate = createAnimationLoop({
        clock: gameState.clock,
        renderer: gameState.renderer,
        scene: gameState.scene,
        camera: gameState.camera,
        updateCallback: updateGame,
        gameStartedCheck: () => gameState.gameStarted
    });
    animate();
}

document.addEventListener('DOMContentLoaded', init);
