import { log, CATEGORIES, LEVELS } from '../utils/logger.js';

const AI_DETECTION_RANGE = 22;
const REPOSITION_TIMEOUT_MS = 1800;

function getSolidObstacles(obstacles) {
    return obstacles.filter(obj => !obj.userData || obj.userData.solid !== false);
}

function checkCollision(position, obstacles, raycaster, collisionDistance) {
    const directions = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, -1)
    ];

    const origin = position.clone();
    let collisionDetected = false;

    for (const dir of directions) {
        raycaster.set(origin, dir);
        const intersects = raycaster.intersectObjects(obstacles);
        if (intersects.length > 0 && intersects[0].distance < collisionDistance) {
            collisionDetected = true;
            break;
        }
    }

    if (!collisionDetected) {
        for (const obstacle of obstacles) {
            const dx = position.x - obstacle.position.x;
            const dz = position.z - obstacle.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < collisionDistance * 1.15) {
                collisionDetected = true;
                break;
            }
        }
    }

    return collisionDetected;
}

function hasLineOfSight(from, to, obstacles, raycaster) {
    const dir = new THREE.Vector3().subVectors(to, from);
    const targetDistance = dir.length();
    if (targetDistance <= 0.001) return true;

    dir.normalize();
    raycaster.set(from, dir);
    const hits = raycaster.intersectObjects(obstacles);
    if (hits.length === 0) return true;
    return hits[0].distance > targetDistance - 0.45;
}

function clampToBounds(object, worldBounds) {
    object.position.x = Math.max(worldBounds.minX, Math.min(worldBounds.maxX, object.position.x));
    object.position.z = Math.max(worldBounds.minZ, Math.min(worldBounds.maxZ, object.position.z));
}

function setAIState(enemy, nextState) {
    const ai = enemy.userData.ai;
    if (ai.state === nextState) return;

    log(CATEGORIES.AI_STATE, LEVELS.DEBUG, `${enemy.name} state transition`, {
        from: ai.state,
        to: nextState,
        role: ai.role
    });

    ai.state = nextState;
}

function pickRepositionTarget(player, worldBounds) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 4 + Math.random() * 4;
    return {
        x: Math.max(worldBounds.minX, Math.min(worldBounds.maxX, player.position.x + Math.cos(angle) * radius)),
        z: Math.max(worldBounds.minZ, Math.min(worldBounds.maxZ, player.position.z + Math.sin(angle) * radius))
    };
}

function getSteeredDirection(origin, desiredDirection, obstacles, raycaster) {
    const base = desiredDirection.clone().setY(0);
    if (base.lengthSq() < 0.0001) {
        return new THREE.Vector3();
    }
    base.normalize();

    const left = base.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 5);
    const right = base.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 5);
    const backward = base.clone().multiplyScalar(-1);
    const candidates = [base, left, right, backward];

    for (const candidate of candidates) {
        raycaster.set(origin, candidate);
        const hits = raycaster.intersectObjects(obstacles);
        if (hits.length === 0 || hits[0].distance > 1.6) {
            return candidate;
        }
    }

    return new THREE.Vector3();
}

function moveEnemy(enemy, direction, speed, delta, obstacles, raycaster, worldBounds) {
    const oldPos = enemy.position.clone();
    enemy.position.x += direction.x * speed * delta * 60;
    enemy.position.z += direction.z * speed * delta * 60;

    const collisionOrigin = enemy.position.clone();
    collisionOrigin.y += 1.0;
    const collided = checkCollision(collisionOrigin, obstacles, raycaster, 1.3);
    if (collided) {
        enemy.position.copy(oldPos);
    }

    clampToBounds(enemy, worldBounds);
    return collided;
}

/**
 * Updates player movement and jump/crouch state.
 */
export function updatePlayer(delta, player, camera, movementFlags, playerConfig, playerState, obstacles, raycaster, worldBounds) {
    const solidObstacles = getSolidObstacles(obstacles);
    const oldPos = player.position.clone();
    const dtFactor = delta * 60;

    let forceCrouch = false;
    if (!movementFlags.isCrouching && playerState.canJump) {
        const upwardOrigin = player.position.clone();
        raycaster.set(upwardOrigin, new THREE.Vector3(0, 1, 0));
        const hits = raycaster.intersectObjects(solidObstacles);
        if (hits.length > 0 && hits[0].distance < playerConfig.standHeight - playerConfig.crouchHeight + 0.2) {
            forceCrouch = true;
        }
    }

    const crouching = movementFlags.isCrouching || forceCrouch;
    const targetHeight = crouching ? playerConfig.crouchHeight : playerConfig.standHeight;

    if (playerState.jumpQueued && playerState.canJump && !crouching) {
        playerState.velocityY = playerConfig.jumpVelocity;
        playerState.canJump = false;
    }
    playerState.jumpQueued = false;

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    forward.y = 0;
    right.y = 0;
    forward.normalize();
    right.normalize();

    const moveDirection = new THREE.Vector3();
    if (movementFlags.moveForward) moveDirection.add(forward);
    if (movementFlags.moveBackward) moveDirection.sub(forward);
    if (movementFlags.moveLeft) moveDirection.sub(right);
    if (movementFlags.moveRight) moveDirection.add(right);
    if (moveDirection.lengthSq() > 0.0001) moveDirection.normalize();

    const speed = crouching ? playerConfig.crouchSpeed : playerConfig.speed;
    player.position.x += moveDirection.x * speed * dtFactor;
    player.position.z += moveDirection.z * speed * dtFactor;

    playerState.velocityY -= playerConfig.gravity * dtFactor;
    player.position.y += playerState.velocityY * dtFactor;

    if (player.position.y <= targetHeight) {
        player.position.y = targetHeight;
        playerState.velocityY = 0;
        playerState.canJump = true;
    }

    const collisionOrigin = player.position.clone();
    const collisionDetected = checkCollision(collisionOrigin, solidObstacles, raycaster, 1.2);
    if (collisionDetected) {
        player.position.x = oldPos.x;
        player.position.z = oldPos.z;
    }

    clampToBounds(player, worldBounds);
    camera.position.copy(player.position);
}

function updatePatrol(enemy, mapMeta, speed, delta, obstacles, raycaster, worldBounds) {
    const ai = enemy.userData.ai;
    const route = mapMeta.patrolRoutes[ai.patrolRouteIndex % mapMeta.patrolRoutes.length];
    if (!route || route.length === 0) return false;

    const node = route[ai.patrolNodeIndex % route.length];
    const target = new THREE.Vector3(node.x, 0, node.z);
    const desired = new THREE.Vector3().subVectors(target, enemy.position);
    desired.y = 0;

    if (desired.lengthSq() < 1.0) {
        ai.patrolNodeIndex = (ai.patrolNodeIndex + 1) % route.length;
        return false;
    }

    const origin = enemy.position.clone();
    origin.y += 1.0;
    const steered = getSteeredDirection(origin, desired, obstacles, raycaster);
    return moveEnemy(enemy, steered, speed * 0.65, delta, obstacles, raycaster, worldBounds);
}

function updateChase(enemy, player, speed, delta, obstacles, raycaster, worldBounds) {
    const desired = new THREE.Vector3().subVectors(player.position, enemy.position);
    desired.y = 0;
    const origin = enemy.position.clone();
    origin.y += 1.0;
    const steered = getSteeredDirection(origin, desired, obstacles, raycaster);
    return moveEnemy(enemy, steered, speed, delta, obstacles, raycaster, worldBounds);
}

function updateReposition(enemy, speed, delta, obstacles, raycaster, worldBounds) {
    const ai = enemy.userData.ai;
    if (!ai.repositionTarget) return true;

    const target = new THREE.Vector3(ai.repositionTarget.x, 0, ai.repositionTarget.z);
    const desired = new THREE.Vector3().subVectors(target, enemy.position);
    desired.y = 0;
    if (desired.lengthSq() < 1.2) {
        return true;
    }

    const origin = enemy.position.clone();
    origin.y += 1.0;
    const steered = getSteeredDirection(origin, desired, obstacles, raycaster);
    moveEnemy(enemy, steered, speed * 0.9, delta, obstacles, raycaster, worldBounds);
    return false;
}

/**
 * Updates enemy AI with role-aware finite states.
 */
export function updateEnemies(delta, enemies, player, obstacles, enemyConfig, scene, enemyBullets, raycaster, mapMeta, isCombatPhase) {
    const solidObstacles = getSolidObstacles(obstacles);
    const now = Date.now();

    enemies.forEach(enemy => {
        const ai = enemy.userData.ai;
        if (!ai) return;

        if (!isCombatPhase) {
            if (ai.role === 'ZONE_GUARD') {
                setAIState(enemy, 'PATROL');
            }
            return;
        }

        const enemyOrigin = enemy.position.clone();
        enemyOrigin.y += 1.0;
        const playerCenter = player.position.clone();
        const distance = enemy.position.distanceTo(player.position);
        const hasLOS = hasLineOfSight(enemyOrigin, playerCenter, solidObstacles, raycaster);

        if (hasLOS) {
            ai.lastSeenPlayerAt = now;
        }

        if (distance < AI_DETECTION_RANGE && hasLOS) {
            if (ai.state === 'PATROL') {
                setAIState(enemy, 'CHASE');
            }
        }

        if (ai.role === 'PURSUER' && ai.state === 'PATROL') {
            setAIState(enemy, 'CHASE');
        }

        if (ai.state === 'PATROL') {
            updatePatrol(
                enemy,
                mapMeta,
                enemyConfig.speed,
                delta,
                solidObstacles,
                raycaster,
                mapMeta.worldBounds
            );
        } else if (ai.state === 'CHASE') {
            const blocked = updateChase(
                enemy,
                player,
                enemyConfig.speed,
                delta,
                solidObstacles,
                raycaster,
                mapMeta.worldBounds
            );

            if (distance <= enemyConfig.range * 0.95 && hasLOS) {
                setAIState(enemy, 'ENGAGE');
            } else if (!hasLOS && now - ai.lastSeenPlayerAt > REPOSITION_TIMEOUT_MS) {
                ai.repositionTarget = pickRepositionTarget(player, mapMeta.worldBounds);
                setAIState(enemy, 'REPOSITION');
            } else if (blocked) {
                ai.repositionTarget = pickRepositionTarget(player, mapMeta.worldBounds);
                setAIState(enemy, 'REPOSITION');
            }
        } else if (ai.state === 'ENGAGE') {
            if (!hasLOS && now - ai.lastSeenPlayerAt > 1200) {
                setAIState(enemy, 'CHASE');
            } else if (distance < 3.2) {
                const retreat = new THREE.Vector3().subVectors(enemy.position, player.position);
                retreat.y = 0;
                moveEnemy(
                    enemy,
                    retreat.normalize(),
                    enemyConfig.speed * 0.8,
                    delta,
                    solidObstacles,
                    raycaster,
                    mapMeta.worldBounds
                );
            } else if (distance > enemyConfig.range * 1.1) {
                updateChase(
                    enemy,
                    player,
                    enemyConfig.speed * 0.9,
                    delta,
                    solidObstacles,
                    raycaster,
                    mapMeta.worldBounds
                );
            }

            if (hasLOS && distance < enemyConfig.range + 2) {
                enemyFire(enemy, player, enemyConfig.fireRate, enemyConfig.damage, enemyConfig.range, scene, enemyBullets);
            }

            if (!hasLOS && now - ai.lastSeenPlayerAt > REPOSITION_TIMEOUT_MS) {
                ai.repositionTarget = pickRepositionTarget(player, mapMeta.worldBounds);
                setAIState(enemy, 'REPOSITION');
            }
        } else if (ai.state === 'REPOSITION') {
            const done = updateReposition(
                enemy,
                enemyConfig.speed,
                delta,
                solidObstacles,
                raycaster,
                mapMeta.worldBounds
            );

            if (done) {
                ai.repositionTarget = null;
                if (distance <= enemyConfig.range && hasLOS) {
                    setAIState(enemy, 'ENGAGE');
                } else if (ai.role === 'ZONE_GUARD') {
                    setAIState(enemy, 'PATROL');
                } else {
                    setAIState(enemy, 'CHASE');
                }
            } else if (distance <= enemyConfig.range && hasLOS) {
                ai.repositionTarget = null;
                setAIState(enemy, 'ENGAGE');
            }
        }

        enemy.lookAt(player.position.x, enemy.position.y + 1.0, player.position.z);
    });
}

function enemyFire(enemy, player, enemyFireRate, enemyDamage, enemyRange, scene, enemyBullets) {
    const currentTime = Date.now();

    if (currentTime - enemy.lastShot < enemyFireRate) {
        return;
    }

    enemy.lastShot = currentTime;

    const direction = new THREE.Vector3().subVectors(player.position, enemy.position).normalize();
    direction.x += (Math.random() - 0.5) * 0.08;
    direction.y += (Math.random() - 0.5) * 0.03;
    direction.z += (Math.random() - 0.5) * 0.08;
    direction.normalize();

    const origin = enemy.position.clone();
    origin.y += 1;

    const tracer = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8),
        new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.82 })
    );
    tracer.position.copy(origin);
    tracer.lookAt(origin.clone().add(direction));
    tracer.rotateX(Math.PI / 2);
    scene.add(tracer);

    enemyBullets.push({
        position: origin,
        direction,
        speed: 0.8,
        range: enemyRange,
        damage: enemyDamage,
        mesh: tracer,
        distance: 0
    });
}

/**
 * Updates player and enemy bullets, applying damage and cleanup.
 */
export function updateBullets(bullets, enemyBullets, enemies, player, obstacles, scene, raycaster, updateHUD, onEnemyKilled, onPlayerHit) {
    const solidObstacles = getSolidObstacles(obstacles);

    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        const oldPos = bullet.position.clone();

        bullet.position.add(bullet.direction.clone().multiplyScalar(bullet.speed));
        bullet.distance += bullet.speed;
        bullet.mesh.position.copy(bullet.position);

        let hitEnemy = false;
        for (let j = 0; j < enemies.length; j++) {
            const enemy = enemies[j];
            const enemyCenter = enemy.position.clone();
            enemyCenter.y += 1.0;
            const distance = bullet.position.distanceTo(enemyCenter);

            if (distance < 1.2) {
                enemy.health -= bullet.damage;
                log(CATEGORIES.COMBAT, LEVELS.INFO, `${enemy.name} hit`, {
                    distance: distance.toFixed(2),
                    damage: bullet.damage,
                    health: enemy.health
                });

                if (enemy.health <= 0) {
                    scene.remove(enemy);
                    enemies.splice(j, 1);
                    onEnemyKilled(enemy);
                }

                hitEnemy = true;
                break;
            }
        }

        let hitWall = false;
        raycaster.set(oldPos, bullet.direction);
        const intersections = raycaster.intersectObjects(solidObstacles);
        if (intersections.length > 0) {
            const distanceToWall = oldPos.distanceTo(intersections[0].point);
            hitWall = distanceToWall <= bullet.speed;
        }

        if (bullet.distance > bullet.range || hitEnemy || hitWall) {
            scene.remove(bullet.mesh);
            bullets.splice(i, 1);
        }
    }

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        const oldPos = bullet.position.clone();

        bullet.position.add(bullet.direction.clone().multiplyScalar(bullet.speed));
        bullet.distance += bullet.speed;
        bullet.mesh.position.copy(bullet.position);

        if (bullet.position.distanceTo(player.position) < 1.0) {
            onPlayerHit(bullet.damage);
            scene.remove(bullet.mesh);
            enemyBullets.splice(i, 1);
            continue;
        }

        let hitWall = false;
        raycaster.set(oldPos, bullet.direction);
        const intersections = raycaster.intersectObjects(solidObstacles);
        if (intersections.length > 0) {
            const distanceToWall = oldPos.distanceTo(intersections[0].point);
            hitWall = distanceToWall <= bullet.speed;
        }

        if (bullet.distance > bullet.range || hitWall) {
            scene.remove(bullet.mesh);
            enemyBullets.splice(i, 1);
        }
    }
}

