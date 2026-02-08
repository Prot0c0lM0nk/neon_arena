/**
 * World environment factory
 * Creates handcrafted tactical arenas with safe-room start and telemetry zones.
 */

function createWall(scene, obstacles, environmentObjects, { x, y, z, w, h, d, color = 0x444455 }) {
    const wall = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({
            color,
            roughness: 0.72,
            metalness: 0.26
        })
    );

    wall.position.set(x, y, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
    obstacles.push(wall);
    environmentObjects.push(wall);
    return wall;
}

function createBoundaryWalls(scene, obstacles, environmentObjects, worldWidth, worldDepth) {
    const thickness = 1;
    const height = 4;
    const halfW = worldWidth / 2;
    const halfD = worldDepth / 2;

    createWall(scene, obstacles, environmentObjects, {
        x: 0, y: height / 2, z: -halfD,
        w: worldWidth + thickness * 2, h: height, d: thickness
    });
    createWall(scene, obstacles, environmentObjects, {
        x: 0, y: height / 2, z: halfD,
        w: worldWidth + thickness * 2, h: height, d: thickness
    });
    createWall(scene, obstacles, environmentObjects, {
        x: -halfW, y: height / 2, z: 0,
        w: thickness, h: height, d: worldDepth + thickness * 2
    });
    createWall(scene, obstacles, environmentObjects, {
        x: halfW, y: height / 2, z: 0,
        w: thickness, h: height, d: worldDepth + thickness * 2
    });
}

function createZoneVisualizer(scene, environmentObjects, zone) {
    const width = zone.bounds.xMax - zone.bounds.xMin;
    const depth = zone.bounds.zMax - zone.bounds.zMin;
    const centerX = (zone.bounds.xMin + zone.bounds.xMax) / 2;
    const centerZ = (zone.bounds.zMin + zone.bounds.zMax) / 2;

    const color = zone.type === 'LIGHT' ? 0xf2df53 : 0x2f8dff;
    const marker = new THREE.Mesh(
        new THREE.PlaneGeometry(width, depth),
        new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: zone.type === 'LIGHT' ? 0.08 : 0.11,
            depthWrite: false
        })
    );

    marker.rotation.x = -Math.PI / 2;
    marker.position.set(centerX, 0.02, centerZ);
    marker.userData.solid = false;
    marker.userData.telemetryZone = true;

    scene.add(marker);
    environmentObjects.push(marker);
}

export function createEnvironment(scene, worldWidth, worldDepth, arenaId = 'arena_alpha') {
    const obstacles = [];
    const environmentObjects = [];

    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(worldWidth, worldDepth),
        new THREE.MeshStandardMaterial({
            color: arenaId === 'arena_beta' ? 0x2b2538 : 0x1d2738,
            roughness: 0.84,
            metalness: 0.18
        })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    environmentObjects.push(floor);

    createBoundaryWalls(scene, obstacles, environmentObjects, worldWidth, worldDepth);

    const safeRoomCenter = { x: -worldWidth / 2 + 6, z: 0 };
    const safeRoom = {
        xMin: safeRoomCenter.x - 3.8,
        xMax: safeRoomCenter.x + 3.8,
        zMin: -4.4,
        zMax: 4.4
    };

    createWall(scene, obstacles, environmentObjects, {
        x: safeRoom.xMin,
        y: 1.6,
        z: 0,
        w: 0.8,
        h: 3.2,
        d: 8.8,
        color: 0x55607a
    });
    createWall(scene, obstacles, environmentObjects, {
        x: safeRoomCenter.x,
        y: 1.6,
        z: safeRoom.zMin,
        w: 7.2,
        h: 3.2,
        d: 0.8,
        color: 0x55607a
    });
    createWall(scene, obstacles, environmentObjects, {
        x: safeRoomCenter.x,
        y: 1.6,
        z: safeRoom.zMax,
        w: 7.2,
        h: 3.2,
        d: 0.8,
        color: 0x55607a
    });

    const gate = createWall(scene, obstacles, environmentObjects, {
        x: safeRoom.xMax,
        y: 1.4,
        z: 0,
        w: 0.6,
        h: 2.8,
        d: 4.2,
        color: 0x00bcd4
    });
    gate.userData.isSafeGate = true;
    gate.userData.solid = true;

    [
        { x: -10, z: -10, w: 3.6, h: 2.4, d: 2.8 },
        { x: -10, z: 10, w: 3.6, h: 2.4, d: 2.8 },
        { x: -2, z: -4, w: 5.4, h: 2.1, d: 2.4 },
        { x: -2, z: 4, w: 5.4, h: 2.1, d: 2.4 },
        { x: 8, z: -12, w: 3.0, h: 2.7, d: 4.2 },
        { x: 8, z: 12, w: 3.0, h: 2.7, d: 4.2 },
        { x: 16, z: -4, w: 4.8, h: 2.2, d: 2.2 },
        { x: 16, z: 4, w: 4.8, h: 2.2, d: 2.2 },
        { x: 21, z: 0, w: 2.2, h: 2.6, d: 6.4 }
    ].forEach(block => {
        createWall(scene, obstacles, environmentObjects, {
            x: block.x,
            y: block.h / 2,
            z: block.z,
            w: block.w,
            h: block.h,
            d: block.d
        });
    });

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    environmentObjects.push(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.82);
    directionalLight.position.set(8, 20, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    environmentObjects.push(directionalLight);

    const worldBounds = {
        minX: -worldWidth / 2 + 1.2,
        maxX: worldWidth / 2 - 1.2,
        minZ: -worldDepth / 2 + 1.2,
        maxZ: worldDepth / 2 - 1.2
    };

    const lightZones = [
        {
            id: 'safe_shadow',
            type: 'DARK',
            intensity: 0.75,
            bounds: {
                xMin: safeRoom.xMin,
                xMax: safeRoom.xMax + 3,
                zMin: safeRoom.zMin,
                zMax: safeRoom.zMax
            }
        },
        {
            id: 'center_light',
            type: 'LIGHT',
            intensity: 0.7,
            bounds: {
                xMin: -6,
                xMax: 10,
                zMin: -8,
                zMax: 8
            }
        },
        {
            id: 'east_light',
            type: 'LIGHT',
            intensity: 0.6,
            bounds: {
                xMin: 10,
                xMax: 24,
                zMin: -16,
                zMax: 16
            }
        },
        {
            id: 'cover_dark_north',
            type: 'DARK',
            intensity: 0.55,
            bounds: {
                xMin: -14,
                xMax: 2,
                zMin: 8,
                zMax: 22
            }
        },
        {
            id: 'cover_dark_south',
            type: 'DARK',
            intensity: 0.55,
            bounds: {
                xMin: -14,
                xMax: 2,
                zMin: -22,
                zMax: -8
            }
        }
    ];

    lightZones.forEach(zone => createZoneVisualizer(scene, environmentObjects, zone));

    const telemetryProbes = [
        { x: -8, y: 2.1, z: 0, intensity: 0.65 },
        { x: 0, y: 2.4, z: 0, intensity: 1 },
        { x: 10, y: 2.5, z: -12, intensity: 0.9 },
        { x: 10, y: 2.5, z: 12, intensity: 0.9 },
        { x: 20, y: 2.8, z: 0, intensity: 0.7 }
    ];

    const mapMeta = {
        arenaId,
        playerSpawn: { x: safeRoomCenter.x - 1.4, y: 1.6, z: 0 },
        safeRoom: {
            bounds: safeRoom,
            gate: {
                mesh: gate,
                closedY: 1.4,
                openY: -2.8,
                isOpen: false
            }
        },
        enemySpawnNodes: [
            { x: 18, z: -16 },
            { x: 18, z: 16 },
            { x: 22, z: 6 },
            { x: 22, z: -6 },
            { x: 10, z: -18 },
            { x: 10, z: 18 },
            { x: 0, z: -17 },
            { x: 0, z: 17 }
        ],
        pickupNodes: [
            { x: -8, z: 0 },
            { x: -1, z: -10 },
            { x: -1, z: 10 },
            { x: 7, z: 0 },
            { x: 14, z: -8 },
            { x: 14, z: 8 }
        ],
        patrolRoutes: [
            [
                { x: 8, z: -15 },
                { x: 16, z: -15 },
                { x: 19, z: -8 },
                { x: 12, z: -6 }
            ],
            [
                { x: 8, z: 15 },
                { x: 16, z: 15 },
                { x: 19, z: 8 },
                { x: 12, z: 6 }
            ],
            [
                { x: 2, z: -8 },
                { x: 8, z: -3 },
                { x: 2, z: 2 },
                { x: -3, z: -2 }
            ],
            [
                { x: 2, z: 8 },
                { x: 8, z: 3 },
                { x: 2, z: -2 },
                { x: -3, z: 2 }
            ]
        ],
        worldBounds,
        lightZones,
        telemetryProbes
    };

    return { obstacles, mapMeta, environmentObjects };
}

export function clearEnvironment(scene, environmentObjects) {
    if (!environmentObjects || environmentObjects.length === 0) return;
    environmentObjects.forEach(obj => scene.remove(obj));
    environmentObjects.length = 0;
}
