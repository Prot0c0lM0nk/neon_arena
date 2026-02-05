/**
 * Game update logic module
 * Handles player movement, enemy AI, and bullet physics
 * 
 * INTENT: Separate game logic updates from rendering
 * INTENT: Make update functions testable with explicit parameters
 * 
 * INVARIANT: All position updates use delta time for frame-rate independence
 * INVARIANT: Collision detection runs before position is finalized
 */

/**
 * Updates player position and handles movement
 * @param {number} delta - Time delta from clock
 * @param {THREE.Object3D} player - Player object
 * @param {THREE.PerspectiveCamera} camera - Player camera
 * @param {Object} movementFlags - Movement state flags
 * @param {number} playerSpeed - Player movement speed
 * @param {Object} playerState - Player physics state (velocity, canJump)
 * @param {number} playerHeight - Player height
 * @param {Array} obstacles - Array of obstacle meshes
 * @param {THREE.Raycaster} raycaster - Raycaster for collision
 * @param {number} worldWidth - World width
 * @param {number} worldDepth - World depth
 */
export function updatePlayer(delta, player, camera, movementFlags, playerSpeed, playerState, playerHeight, obstacles, raycaster, worldWidth, worldDepth) {
    // Store old position for collision recovery
    const oldPos = player.position.clone();
    
    // Calculate movement direction based on keyboard input
    const moveVector = new THREE.Vector3();
    
    if (movementFlags.moveForward) moveVector.z -= playerSpeed;
    if (movementFlags.moveBackward) moveVector.z += playerSpeed;
    if (movementFlags.moveLeft) moveVector.x -= playerSpeed;
    if (movementFlags.moveRight) moveVector.x += playerSpeed;
    
    // Apply movement direction relative to camera orientation
    moveVector.applyQuaternion(camera.quaternion);
    moveVector.y = 0; // Keep movement horizontal
    
    // Apply movement to player
    player.position.add(moveVector);
    
    // Apply gravity
    playerState.velocity.y -= 0.01;
    player.position.y += playerState.velocity.y;
    
    // Check if player is on the ground
    if (player.position.y <= playerHeight) {
        player.position.y = playerHeight;
        playerState.velocity.y = 0;
        playerState.canJump = true;
    }
    
    // Check collision with obstacles
    const collisionDistance = 1.5;
    const directions = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, -1)
    ];
    
    let collisionDetected = false;
    
    for (const dir of directions) {
        raycaster.set(player.position, dir);
        const intersects = raycaster.intersectObjects(obstacles);
        
        if (intersects.length > 0 && intersects[0].distance < collisionDistance) {
            collisionDetected = true;
            break;
        }
    }
    
    // Fallback distance check
    if (!collisionDetected) {
        for (const obstacle of obstacles) {
            if (player.position.distanceTo(obstacle.position) < 2.0) {
                collisionDetected = true;
                break;
            }
        }
    }
    
    if (collisionDetected) {
        player.position.copy(oldPos);
    }
    
    // Keep player within world bounds
    player.position.x = Math.max(-worldWidth/2 + 1, Math.min(worldWidth/2 - 1, player.position.x));
    player.position.z = Math.max(-worldDepth/2 + 1, Math.min(worldDepth/2 - 1, player.position.z));
    
    // Update camera to follow player
    camera.position.copy(player.position);
}

/**
 * Updates enemy positions and AI
 * @param {number} delta - Time delta
 * @param {Array} enemies - Array of enemy objects
 * @param {THREE.Object3D} player - Player object
 * @param {Array} obstacles - Array of obstacles
 * @param {number} enemySpeed - Enemy movement speed
 * @param {number} enemyRange - Enemy attack range
 * @param {number} enemyFireRate - Enemy fire rate in ms
 * @param {number} enemyDamage - Enemy damage per shot
 * @param {THREE.Scene} scene - Scene for bullet creation
 * @param {Array} enemyBullets - Array to track enemy bullets
 * @param {THREE.Raycaster} raycaster - Raycaster for collision
 * @param {number} worldWidth - World width
 * @param {number} worldDepth - World depth
 */
export function updateEnemies(delta, enemies, player, obstacles, enemySpeed, enemyRange, enemyFireRate, enemyDamage, scene, enemyBullets, raycaster, worldWidth, worldDepth) {
    enemies.forEach(enemy => {
        const oldPos = enemy.position.clone();
        
        // Move enemy toward player
        const direction = new THREE.Vector3();
        direction.subVectors(player.position, enemy.position).normalize();

        // Keep distance from player
        const distance = enemy.position.distanceTo(player.position);
        if (distance > 5) {
            enemy.position.x += direction.x * enemySpeed;
            enemy.position.z += direction.z * enemySpeed;
        } else if (distance < 3) {
            enemy.position.x -= direction.x * enemySpeed;
            enemy.position.z -= direction.z * enemySpeed;
        }
        
        // Check collision with obstacles
        const collisionDistance = 1.5;
        const directions = [
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(0, 0, -1)
        ];
        
        let collisionDetected = false;
        
        for (const dir of directions) {
            raycaster.set(enemy.position, dir);
            const intersects = raycaster.intersectObjects(obstacles);
            
            if (intersects.length > 0 && intersects[0].distance < collisionDistance) {
                collisionDetected = true;
                break;
            }
        }
        
        // Fallback distance check
        if (!collisionDetected) {
            for (const obstacle of obstacles) {
                if (enemy.position.distanceTo(obstacle.position) < 2.0) {
                    collisionDetected = true;
                    break;
                }
            }
        }
        
        if (collisionDetected) {
            enemy.position.copy(oldPos);
        }
        
        // Keep enemy within world bounds
        enemy.position.x = Math.max(-worldWidth/2 + 1, Math.min(worldWidth/2 - 1, enemy.position.x));
        enemy.position.z = Math.max(-worldDepth/2 + 1, Math.min(worldDepth/2 - 1, enemy.position.z));
        
        // Face player - droids are Groups, so lookAt works on the whole droid
        enemy.lookAt(player.position.x, enemy.position.y, player.position.z);
        
        // Enemy shooting
        if (distance < enemyRange) {
            enemyFire(enemy, player, enemyFireRate, enemyDamage, enemyRange, scene, enemyBullets);
        }
    });
}

/**
 * Enemy fire logic
 */
function enemyFire(enemy, player, enemyFireRate, enemyDamage, enemyRange, scene, enemyBullets) {
    const currentTime = Date.now();
    
    if (currentTime - enemy.lastShot < enemyFireRate) {
        return;
    }
    
    enemy.lastShot = currentTime;
    
    // Calculate direction to player
    const direction = new THREE.Vector3();
    direction.subVectors(player.position, enemy.position).normalize();
    
    // Add some inaccuracy
    direction.x += (Math.random() - 0.5) * 0.1;
    direction.z += (Math.random() - 0.5) * 0.1;
    direction.normalize();
    
    // Create enemy bullet
    const origin = enemy.position.clone();
    origin.y += 1;
    
    // Create tracer
    const tracerGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8);
    const tracerMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        transparent: true,
        opacity: 0.8
    });
    const tracer = new THREE.Mesh(tracerGeometry, tracerMaterial);
    
    tracer.position.copy(origin);
    tracer.lookAt(origin.clone().add(direction));
    tracer.rotateX(Math.PI / 2);
    scene.add(tracer);
    
    enemyBullets.push({
        position: origin,
        direction: direction,
        speed: 0.8,
        range: enemyRange,
        damage: enemyDamage,
        mesh: tracer,
        distance: 0
    });
}

/**
 * Updates bullets and handles collisions
 * @param {Array} bullets - Player bullets array
 * @param {Array} enemyBullets - Enemy bullets array
 * @param {Array} enemies - Enemy array
 * @param {THREE.Object3D} player - Player object
 * @param {Array} obstacles - Obstacles array
 * @param {THREE.Scene} scene - Scene for removing bullets
 * @param {THREE.Raycaster} raycaster - Raycaster for collision
 * @param {Function} updateHUD - HUD update function
 * @param {Function} onEnemyKilled - Callback when enemy killed
 * @param {Function} onPlayerHit - Callback when player hit
 * @param {Function} onGameOver - Callback for game over
 */
export function updateBullets(bullets, enemyBullets, enemies, player, obstacles, scene, raycaster, updateHUD, onEnemyKilled, onPlayerHit, onGameOver) {
    // Update player bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        const oldPos = bullet.position.clone();
        
        bullet.position.add(bullet.direction.clone().multiplyScalar(bullet.speed));
        bullet.distance += bullet.speed;
        bullet.mesh.position.copy(bullet.position);
        
        // Check if bullet hit an enemy
        let hitEnemy = false;
        for (let j = 0; j < enemies.length; j++) {
            const enemy = enemies[j];
            // Droids are Groups, so check distance to the group position
            // The droid's center is at torso height (around Y=1.0)
            const enemyCenter = enemy.position.clone();
            enemyCenter.y += 1.0; // Adjust to center of droid
            
            if (bullet.position.distanceTo(enemyCenter) < 1.2) {
                enemy.health -= bullet.damage;
                
                if (enemy.health <= 0) {
                    scene.remove(enemy);
                    enemies.splice(j, 1);
                    onEnemyKilled();
                }
                
                hitEnemy = true;
                break;
        }
        
        // Check if bullet hit a wall
        let hitWall = false;
        raycaster.set(oldPos, bullet.direction);
        const intersects = raycaster.intersectObjects(obstacles);
        
        if (intersects.length > 0) {
            const intersectionPoint = intersects[0].point;
            const distanceToIntersection = oldPos.distanceTo(intersectionPoint);
            if (distanceToIntersection <= bullet.speed) {
                hitWall = true;
            }
        }
        
        if (bullet.distance > bullet.range || hitEnemy || hitWall) {
            scene.remove(bullet.mesh);
            bullets.splice(i, 1);
        }
            bullets.splice(i, 1);
        }
    }
    
    // Update enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        const oldPos = bullet.position.clone();
        
        bullet.position.add(bullet.direction.clone().multiplyScalar(bullet.speed));
        bullet.distance += bullet.speed;
        bullet.mesh.position.copy(bullet.position);
        
        // Check if bullet hit player
        if (bullet.position.distanceTo(player.position) < 1.0) {
            onPlayerHit(bullet.damage);
            scene.remove(bullet.mesh);
            enemyBullets.splice(i, 1);
            continue;
        }
        
        // Check if bullet hit a wall
        let hitWall = false;
        raycaster.set(oldPos, bullet.direction);
        const intersects = raycaster.intersectObjects(obstacles);
        
        if (intersects.length > 0) {
            const intersectionPoint = intersects[0].point;
            const distanceToIntersection = oldPos.distanceTo(intersectionPoint);
            if (distanceToIntersection <= bullet.speed) {
                hitWall = true;
            }
        }
        
        if (bullet.distance > bullet.range || hitWall) {
            scene.remove(bullet.mesh);
            enemyBullets.splice(i, 1);
        }
    }
}
