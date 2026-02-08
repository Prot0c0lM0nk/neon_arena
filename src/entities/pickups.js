import { log, CATEGORIES, LEVELS } from '../utils/logger.js';

function createHealthPickup(node) {
    const group = new THREE.Group();

    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.7, 0.2, 20),
        new THREE.MeshStandardMaterial({
            color: 0x1f3a2a,
            roughness: 0.5,
            metalness: 0.4
        })
    );
    base.position.y = 0.1;
    group.add(base);

    const cross = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.08, 0.5),
        new THREE.MeshBasicMaterial({ color: 0x7bff7b })
    );
    cross.position.y = 0.28;
    cross.rotation.y = Math.PI / 4;
    group.add(cross);

    const halo = new THREE.Mesh(
        new THREE.TorusGeometry(0.55, 0.05, 10, 24),
        new THREE.MeshBasicMaterial({ color: 0x98ff98 })
    );
    halo.position.y = 0.26;
    halo.rotation.x = Math.PI / 2;
    group.add(halo);

    group.position.set(node.x, 0, node.z);
    group.userData.pickupType = 'health';
    return group;
}

function createUnlockPickup(node, type) {
    const isShotgun = type === 'unlock_shotgun';
    const color = isShotgun ? 0xffa23a : 0x70a8ff;

    const group = new THREE.Group();

    const orb = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.35, 0),
        new THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.35,
            roughness: 0.2,
            metalness: 0.7
        })
    );
    orb.position.y = 0.85;
    group.add(orb);

    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.52, 0.06, 12, 32),
        new THREE.MeshBasicMaterial({ color })
    );
    ring.position.y = 0.85;
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.13, 0.5, 10),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.75 })
    );
    pillar.position.y = 0.25;
    group.add(pillar);

    group.position.set(node.x, 0, node.z);
    group.userData.pickupType = type;
    return group;
}

function pickNodes(nodePool, count) {
    const pool = [...nodePool];
    const picked = [];

    while (pool.length > 0 && picked.length < count) {
        const idx = Math.floor(Math.random() * pool.length);
        picked.push(pool[idx]);
        pool.splice(idx, 1);
    }

    return picked;
}

export function spawnRoundPickups({ scene, pickups, round, unlockedWeapons, pickupNodes }) {
    clearPickups(scene, pickups);

    if (!pickupNodes || pickupNodes.length === 0) {
        return;
    }

    const types = [];
    if (round >= 1) {
        types.push('health');
    }
    if (round >= 2 && !unlockedWeapons.has('shotgun')) {
        types.push('unlock_shotgun');
    }
    if (round >= 4 && !unlockedWeapons.has('sniper')) {
        types.push('unlock_sniper');
    }

    const nodes = pickNodes(pickupNodes, types.length);
    types.forEach((type, i) => {
        const node = nodes[i % nodes.length];
        if (!node) return;

        const mesh = type === 'health'
            ? createHealthPickup(node)
            : createUnlockPickup(node, type);

        scene.add(mesh);
        pickups.push({
            type,
            mesh,
            bobTime: Math.random() * Math.PI * 2,
            baseY: mesh.position.y
        });

        log(CATEGORIES.PICKUP, LEVELS.INFO, 'Pickup spawned', {
            type,
            x: node.x.toFixed(1),
            z: node.z.toFixed(1),
            round
        });
    });
}

export function updatePickups(pickups, delta) {
    pickups.forEach(pickup => {
        pickup.bobTime += delta * 2.4;
        pickup.mesh.rotation.y += delta * 1.5;
        pickup.mesh.position.y = pickup.baseY + Math.sin(pickup.bobTime) * 0.12;
    });
}

export function tryCollectPickups({ player, pickups, scene, onCollect, radius = 2.0 }) {
    const collected = [];

    for (let i = pickups.length - 1; i >= 0; i--) {
        const pickup = pickups[i];
        // Use horizontal distance for collection checks so camera height does not
        // make pickups hard to collect when standing directly over them.
        const dx = player.position.x - pickup.mesh.position.x;
        const dz = player.position.z - pickup.mesh.position.z;
        const horizontalDistance = Math.sqrt(dx * dx + dz * dz);

        if (horizontalDistance <= radius) {
            scene.remove(pickup.mesh);
            pickups.splice(i, 1);
            collected.push(pickup.type);

            log(CATEGORIES.PICKUP, LEVELS.INFO, 'Pickup collected', {
                type: pickup.type,
                distance: horizontalDistance.toFixed(2)
            });

            if (onCollect) {
                onCollect(pickup.type);
            }
        }
    }

    return collected;
}

export function clearPickups(scene, pickups) {
    pickups.forEach(p => scene.remove(p.mesh));
    pickups.length = 0;
}
