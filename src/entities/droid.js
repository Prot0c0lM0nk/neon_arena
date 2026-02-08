import { log, CATEGORIES, LEVELS } from '../utils/logger.js';

function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function createDroidMesh(color) {
    const droid = new THREE.Group();

    const bodyMaterial = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.3,
        metalness: 0.7
    });
    const darkMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.8,
        metalness: 0.3
    });
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.9
    });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.6), bodyMaterial);
    torso.position.y = 1.0;
    torso.castShadow = true;
    torso.receiveShadow = true;
    droid.add(torso);

    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.1), darkMaterial);
    chest.position.set(0, 1.1, 0.35);
    chest.castShadow = true;
    droid.add(chest);

    const core = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.05), glowMaterial);
    core.position.set(0, 1.1, 0.41);
    droid.add(core);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), bodyMaterial);
    head.position.y = 1.7;
    head.castShadow = true;
    droid.add(head);

    const eyeBand = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.1, 0.4), darkMaterial);
    eyeBand.position.set(0, 1.7, 0.08);
    droid.add(eyeBand);

    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.05), glowMaterial);
    eye.position.set(0, 1.7, 0.29);
    droid.add(eye);

    const antenna = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.05), darkMaterial);
    antenna.position.set(0.15, 1.95, 0);
    droid.add(antenna);

    const antennaTip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), glowMaterial);
    antennaTip.position.set(0.15, 2.1, 0);
    droid.add(antennaTip);

    const armGeometry = new THREE.BoxGeometry(0.25, 0.8, 0.25);
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-0.6, 1.0, 0);
    leftArm.castShadow = true;
    droid.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(0.6, 1.0, 0);
    rightArm.castShadow = true;
    droid.add(rightArm);

    const shoulderGeometry = new THREE.BoxGeometry(0.35, 0.2, 0.35);
    const leftShoulder = new THREE.Mesh(shoulderGeometry, darkMaterial);
    leftShoulder.position.set(-0.6, 1.4, 0);
    droid.add(leftShoulder);

    const rightShoulder = new THREE.Mesh(shoulderGeometry, darkMaterial);
    rightShoulder.position.set(0.6, 1.4, 0);
    droid.add(rightShoulder);

    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.08), darkMaterial);
    barrel.position.set(0.6, 0.6, 0.2);
    droid.add(barrel);

    const barrelTip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), glowMaterial);
    barrelTip.position.set(0.6, 0.45, 0.2);
    droid.add(barrelTip);

    const legGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.4);
    const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    leftLeg.position.set(-0.25, 0.4, 0);
    leftLeg.castShadow = true;
    droid.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
    rightLeg.position.set(0.25, 0.4, 0);
    rightLeg.castShadow = true;
    droid.add(rightLeg);

    const footGeometry = new THREE.BoxGeometry(0.35, 0.15, 0.5);
    const leftFoot = new THREE.Mesh(footGeometry, darkMaterial);
    leftFoot.position.set(-0.25, 0.075, 0.05);
    droid.add(leftFoot);

    const rightFoot = new THREE.Mesh(footGeometry, darkMaterial);
    rightFoot.position.set(0.25, 0.075, 0.05);
    droid.add(rightFoot);

    const ventGeometry = new THREE.BoxGeometry(0.15, 0.3, 0.05);
    const leftVent = new THREE.Mesh(ventGeometry, darkMaterial);
    leftVent.position.set(-0.2, 1.0, -0.32);
    droid.add(leftVent);

    const rightVent = new THREE.Mesh(ventGeometry, darkMaterial);
    rightVent.position.set(0.2, 1.0, -0.32);
    droid.add(rightVent);

    return droid;
}

function createDroid(scene, color, spawnNode, aiConfig, id) {
    const droid = createDroidMesh(color);
    droid.position.set(spawnNode.x, 0, spawnNode.z);
    droid.health = 100;
    droid.lastShot = 0;
    droid.name = `Droid-${id}`;

    droid.userData.id = id;
    droid.userData.ai = {
        role: aiConfig.role,
        state: aiConfig.initialState,
        patrolRouteIndex: aiConfig.patrolRouteIndex,
        patrolNodeIndex: 0,
        lastSeenPlayerAt: 0,
        repositionTarget: null
    };

    scene.add(droid);
    return droid;
}

export function createDroids(scene, count, colors, mapMeta, round = 1) {
    const droids = [];
    const spawnNodes = shuffle(mapMeta.enemySpawnNodes);
    const pursuerCount = Math.max(1, Math.min(2, Math.floor(count / 4)));

    for (let i = 0; i < count; i++) {
        const spawnNode = spawnNodes[i % spawnNodes.length];
        const jitter = {
            x: (Math.random() - 0.5) * 1.5,
            z: (Math.random() - 0.5) * 1.5
        };

        const role = i < pursuerCount ? 'PURSUER' : 'ZONE_GUARD';
        const patrolRouteIndex = i % mapMeta.patrolRoutes.length;
        const aiConfig = {
            role,
            initialState: role === 'PURSUER' ? 'CHASE' : 'PATROL',
            patrolRouteIndex
        };

        const droid = createDroid(
            scene,
            colors[i % colors.length],
            { x: spawnNode.x + jitter.x, z: spawnNode.z + jitter.z },
            aiConfig,
            i
        );
        droids.push(droid);

        log(CATEGORIES.SPAWN, LEVELS.INFO, `${droid.name} spawned`, {
            role,
            state: aiConfig.initialState,
            route: patrolRouteIndex,
            x: droid.position.x.toFixed(1),
            z: droid.position.z.toFixed(1),
            round
        });
    }

    return droids;
}

export function clearDroids(scene, droids) {
    droids.forEach(droid => scene.remove(droid));
}

