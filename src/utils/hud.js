/**
 * Tactical HUD utilities
 * Structured HUD API with backward-compatible wrappers.
 */

const hudState = {
    initialized: false,
    refs: {},
    core: {
        health: 100,
        healthMax: 100,
        ammo: 0,
        ammoMax: 0,
        round: 1,
        floor: 1,
        weaponType: 'rifle',
        isMelee: false
    },
    stealth: {
        light: 0,
        sound: 0
    }
};

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function getPercent(value, max) {
    if (!max || max <= 0) return 0;
    return clamp((value / max) * 100, 0, 100);
}

function applyBar(fillEl, valueEl, percent, labelText) {
    if (!fillEl || !valueEl) return;
    fillEl.style.width = `${clamp(percent, 0, 100).toFixed(1)}%`;
    valueEl.textContent = labelText;
}

export function initHUD() {
    hudState.refs = {
        healthFill: document.getElementById('healthFill'),
        healthValue: document.getElementById('healthValue'),
        lightFill: document.getElementById('lightFill'),
        lightValue: document.getElementById('lightValue'),
        soundFill: document.getElementById('soundFill'),
        soundValue: document.getElementById('soundValue'),
        ammoFill: document.getElementById('ammoFill'),
        ammoValue: document.getElementById('ammoValue'),
        roundValue: document.getElementById('roundValue'),
        floorValue: document.getElementById('floorValue'),
        objective: document.getElementById('hudObjective')
    };

    hudState.initialized = true;
    updateHUDCore(hudState.core);
    updateStealthHUD(hudState.stealth);
}

export function updateHUDCore({
    health,
    healthMax,
    ammo,
    ammoMax,
    round,
    floor,
    weaponType,
    isMelee
}) {
    if (!hudState.initialized) initHUD();

    if (health !== undefined && health !== null) hudState.core.health = health;
    if (healthMax !== undefined && healthMax !== null) hudState.core.healthMax = healthMax;
    if (ammo !== undefined && ammo !== null) hudState.core.ammo = ammo;
    if (ammoMax !== undefined && ammoMax !== null) hudState.core.ammoMax = ammoMax;
    if (round !== undefined && round !== null) hudState.core.round = round;
    if (floor !== undefined && floor !== null) hudState.core.floor = floor;
    if (weaponType !== undefined && weaponType !== null) hudState.core.weaponType = weaponType;
    if (isMelee !== undefined && isMelee !== null) hudState.core.isMelee = isMelee;

    const refs = hudState.refs;
    const healthPct = getPercent(hudState.core.health, hudState.core.healthMax);
    applyBar(refs.healthFill, refs.healthValue, healthPct, `${Math.max(0, Math.floor(hudState.core.health))}%`);

    if (hudState.core.isMelee) {
        applyBar(refs.ammoFill, refs.ammoValue, 100, 'MELEE');
    } else {
        const ammoPct = getPercent(hudState.core.ammo, hudState.core.ammoMax);
        applyBar(refs.ammoFill, refs.ammoValue, ammoPct, `${hudState.core.ammo}/${hudState.core.ammoMax}`);
    }

    if (refs.roundValue) {
        refs.roundValue.textContent = `Round: ${hudState.core.round}`;
    }

    if (refs.floorValue) {
        refs.floorValue.textContent = `Floor: ${hudState.core.floor}`;
    }
}

export function updateStealthHUD({ light, sound }) {
    if (!hudState.initialized) initHUD();

    if (light !== undefined && light !== null) hudState.stealth.light = clamp(light, 0, 100);
    if (sound !== undefined && sound !== null) hudState.stealth.sound = clamp(sound, 0, 100);

    const refs = hudState.refs;
    applyBar(
        refs.lightFill,
        refs.lightValue,
        hudState.stealth.light,
        `${Math.round(hudState.stealth.light)}%`
    );
    applyBar(
        refs.soundFill,
        refs.soundValue,
        hudState.stealth.sound,
        `${Math.round(hudState.stealth.sound)}%`
    );
}

export function setHUDObjective(text) {
    if (!hudState.initialized) initHUD();

    const objective = hudState.refs.objective;
    if (!objective) return;

    if (!text) {
        objective.style.display = 'none';
        objective.textContent = '';
        return;
    }

    objective.textContent = text;
    objective.style.display = 'block';
}

// Backward compatibility wrappers for existing callers.
export function updateHUD(ammo, maxAmmo, health, round) {
    updateHUDCore({
        ammo,
        ammoMax: maxAmmo,
        health,
        round
    });
}

export function updateAmmo(ammo, maxAmmo) {
    updateHUDCore({ ammo, ammoMax: maxAmmo });
}

export function updateHealth(health) {
    updateHUDCore({ health });
}

export function updateRound(round) {
    updateHUDCore({ round });
}
