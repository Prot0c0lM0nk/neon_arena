const state = {
    initialized: false,
    root: null,
    weaponType: 'rifle',
    bobTime: 0,
    recoil: 0,
    sway: 0
};

export function initViewmodelSprite() {
    state.root = document.getElementById('viewmodelSprite');
    state.initialized = Boolean(state.root);
    if (!state.initialized) return;

    setViewmodelWeapon('rifle');
    setViewmodelVisible(false);
}

export function setViewmodelVisible(isVisible) {
    if (!state.initialized) return;
    state.root.style.display = isVisible ? 'block' : 'none';
}

export function setViewmodelWeapon(weaponType) {
    if (!state.initialized) return;

    state.weaponType = weaponType;
    state.root.classList.remove('weapon-rifle', 'weapon-shotgun', 'weapon-sniper');
    state.root.classList.add(`weapon-${weaponType}`);
}

export function applyViewmodelRecoil(power = 1) {
    state.recoil = Math.min(1.4, state.recoil + 0.45 * power);
}

export function updateViewmodelSprite({ delta, movementIntensity = 0, isCrouching = false }) {
    if (!state.initialized) return;

    const dt = Math.max(0.0001, delta);
    const move = Math.max(0, Math.min(1, movementIntensity));

    state.bobTime += dt * (2.4 + move * 5.2);
    state.recoil = Math.max(0, state.recoil - dt * 4.9);
    state.sway = state.sway * 0.88 + move * 0.12;

    const bobX = Math.sin(state.bobTime) * (2.5 + move * 7.2);
    const bobY = Math.abs(Math.cos(state.bobTime * 1.2)) * (2 + move * 8.5);
    const recoilY = -state.recoil * 20;
    const recoilRot = -state.recoil * 5.2;
    const crouchOffset = isCrouching ? 14 : 0;

    state.root.style.transform = `translate3d(${bobX}px, ${bobY + recoilY + crouchOffset}px, 0) rotate(${recoilRot.toFixed(2)}deg)`;
}
