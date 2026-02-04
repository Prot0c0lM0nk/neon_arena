/**
 * Weapon configuration constants
 * Defines the three selectable weapon types with their unique characteristics.
 * 
 * INVARIANT: All weapons must have consistent property set for UI rendering
 * INVARIANT: Fire rate is in milliseconds between shots (lower = faster)
 * INVARIANT: Spread is in radians - affects bullet trajectory randomization
 * INVARIANT: Tracer properties control visual bullet representation
 * 
 * DEPENDENCIES: Used by fireWeapon(), createBullet(), reloadWeapon()
 * DEPENDENCIES: Referenced by startGame() for initial ammo setup
 * DEPENDENCIES: Referenced by HUD update for ammo display
 */
export const weapons = {
    rifle: {
        damage: 20,           // Moderate damage per shot
        fireRate: 150,        // 150ms between shots (~6.6 shots/sec)
        range: 100,           // Effective range in meters
        maxAmmo: 30,          // Magazine capacity
        ammo: 30,             // Current ammo (starts full)
        spread: 0.05,         // Slight accuracy variance
        color: 0x00ff00,      // Green tracer
        tracerWidth: 0.05,    // Visual tracer thickness
        tracerLength: 1.0     // Visual tracer length
    },
    shotgun: {
        damage: 10,           // Low per-pellet damage
        fireRate: 800,        // 800ms between shots (slow)
        range: 30,            // Short effective range
        maxAmmo: 8,           // Shell capacity
        ammo: 8,              // Current ammo
        spread: 0.2,          // Wide pellet spread
        pellets: 8,           // Number of pellets per shot
        color: 0xff0000,      // Red tracer
        tracerWidth: 0.1,     // Thicker tracers for visibility
        tracerLength: 0.5     // Shorter tracers
    },
    sniper: {
        damage: 80,           // High damage per shot
        fireRate: 1200,       // 1200ms between shots (very slow)
        range: 200,           // Long effective range
        maxAmmo: 5,           // Small magazine
        ammo: 5,              // Current ammo
        spread: 0.01,         // Very accurate
        color: 0x0000ff,      // Blue tracer
        tracerWidth: 0.03,    // Thin tracer
        tracerLength: 2.0     // Long tracer for visibility
    }
};