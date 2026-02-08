/**
 * Minimap rendering utility
 * Player-rotating tactical minimap with soft neon styling.
 */

function drawBackground(ctx, size) {
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, 'rgba(4, 12, 26, 0.95)');
    gradient.addColorStop(1, 'rgba(2, 6, 14, 0.96)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = 'rgba(43, 101, 148, 0.22)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= size; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, size);
        ctx.stroke();
    }

    for (let y = 0; y <= size; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y);
        ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let y = 0; y < size; y += 6) {
        ctx.fillRect(0, y, size, 1);
    }
}

function drawPlayerWedge(ctx, x, y, camera) {
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);

    const angle = Math.atan2(direction.x, direction.z);
    const tipDistance = 13;
    const wingDistance = 7;

    const tipX = x + Math.sin(angle) * tipDistance;
    const tipY = y + Math.cos(angle) * tipDistance;

    const leftAngle = angle + Math.PI * 0.78;
    const rightAngle = angle - Math.PI * 0.78;

    const leftX = x + Math.sin(leftAngle) * wingDistance;
    const leftY = y + Math.cos(leftAngle) * wingDistance;
    const rightX = x + Math.sin(rightAngle) * wingDistance;
    const rightY = y + Math.cos(rightAngle) * wingDistance;

    ctx.fillStyle = '#12e9e1';
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, 4.6, 0, Math.PI * 2);
    ctx.fillStyle = '#16e6de';
    ctx.fill();
}

export function updateMinimap(player, camera, enemies, worldWidth, worldDepth) {
    const canvas = document.getElementById('minimapCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const size = 268;
    const scale = size / Math.max(worldWidth, worldDepth);

    canvas.width = size;
    canvas.height = size;

    drawBackground(ctx, size);

    const playerX = (player.position.x + worldWidth / 2) * scale;
    const playerY = (player.position.z + worldDepth / 2) * scale;

    enemies.forEach(enemy => {
        const enemyX = (enemy.position.x + worldWidth / 2) * scale;
        const enemyY = (enemy.position.z + worldDepth / 2) * scale;

        ctx.beginPath();
        ctx.arc(enemyX, enemyY, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = '#ff394a';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(enemyX, enemyY, 5.2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 57, 74, 0.22)';
        ctx.stroke();
    });

    drawPlayerWedge(ctx, playerX, playerY, camera);

    ctx.strokeStyle = 'rgba(29, 232, 222, 0.7)';
    ctx.lineWidth = 1;
    ctx.strokeRect(1, 1, size - 2, size - 2);
}

export function initMinimap() {
    const canvas = document.getElementById('minimapCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 268;
    canvas.height = 268;
    drawBackground(ctx, 268);
}
