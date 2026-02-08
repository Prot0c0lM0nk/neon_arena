function clamp(value, min = 0, max = 100) {
    return Math.max(min, Math.min(max, value));
}

function insideBounds(pos, bounds) {
    if (!bounds) return false;
    return (
        pos.x >= bounds.xMin &&
        pos.x <= bounds.xMax &&
        pos.z >= bounds.zMin &&
        pos.z <= bounds.zMax
    );
}

function getSolidObstacles(obstacles) {
    return obstacles.filter(obj => !obj.userData || obj.userData.solid !== false);
}

function getZoneBaseExposure(playerPosition, lightZones) {
    if (!lightZones || lightZones.length === 0) {
        return 52;
    }

    let exposure = 50;
    let matchedAny = false;

    for (const zone of lightZones) {
        if (!insideBounds(playerPosition, zone.bounds)) continue;

        matchedAny = true;
        const intensity = zone.intensity ?? 0.5;
        if (zone.type === 'LIGHT') {
            exposure += intensity * 35;
        } else if (zone.type === 'DARK') {
            exposure -= intensity * 35;
        }
    }

    if (!matchedAny) {
        exposure = 52;
    }

    return clamp(exposure, 8, 92);
}

function getProbeExposure({ player, probes, obstacles, raycaster }) {
    if (!probes || probes.length === 0 || !player || !raycaster) {
        return 0;
    }

    const solid = getSolidObstacles(obstacles);
    const playerPoint = player.position.clone();
    playerPoint.y += 1.0;

    let exposure = 0;

    for (const probe of probes) {
        const probePoint = new THREE.Vector3(probe.x, probe.y ?? 1.8, probe.z);
        const direction = new THREE.Vector3().subVectors(playerPoint, probePoint);
        const targetDistance = direction.length();
        if (targetDistance <= 0.001) continue;

        direction.normalize();
        raycaster.set(probePoint, direction);
        const hits = raycaster.intersectObjects(solid);
        const blocked = hits.length > 0 && hits[0].distance < targetDistance - 0.35;

        if (!blocked) {
            const distFactor = clamp(1 - targetDistance / 42, 0, 1);
            const probePower = probe.intensity ?? 1;
            exposure += distFactor * 18 * probePower;
        }
    }

    return clamp(exposure, 0, 42);
}

function getCoverReduction(player, obstacles) {
    if (!player || !obstacles) return 0;

    const solid = getSolidObstacles(obstacles);
    let nearby = 0;
    for (const obstacle of solid) {
        const dx = player.position.x - obstacle.position.x;
        const dz = player.position.z - obstacle.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 3.2) nearby += 1;
    }

    return clamp(nearby * 4.5, 0, 18);
}

export function computeLightTelemetry({
    player,
    mapMeta,
    obstacles,
    raycaster,
    isCrouching
}) {
    if (!player || !mapMeta) return 0;

    const zoneBase = getZoneBaseExposure(player.position, mapMeta.lightZones);
    const probeExposure = getProbeExposure({
        player,
        probes: mapMeta.telemetryProbes,
        obstacles,
        raycaster
    });

    const coverReduction = getCoverReduction(player, obstacles);

    let value = zoneBase + probeExposure - coverReduction;
    if (isCrouching) {
        value -= 8;
    }

    return clamp(value);
}

export function computeSoundTelemetry(state, dt) {
    const dtSafe = Math.max(0.0001, dt);
    const movementMagnitude = clamp(state.movementMagnitude ?? 0, 0, 1);

    const movementNoise = movementMagnitude * (state.isCrouching ? 24 : 56);
    const passiveNoise = state.isCrouching ? 6 : 10;
    const impulse = clamp(state.impulse ?? 0, 0, 100);

    let target = passiveNoise + movementNoise + impulse;
    target = clamp(target);

    const current = clamp(state.current ?? 0, 0, 100);
    const riseRate = state.isCrouching ? 4.8 : 6.6;
    const fallRate = state.isCrouching ? 3.8 : 2.9;
    const rate = target > current ? riseRate : fallRate;

    const smooth = current + (target - current) * Math.min(1, dtSafe * rate);
    return clamp(smooth);
}
