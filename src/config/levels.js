/**
 * Floor/Arena progression config
 * Three rounds per arena; one arena active at a time.
 */

const BASE_ROUNDS_PER_ARENA = 3;

export const levels = [
    {
        floorId: 1,
        arenaId: 'arena_alpha',
        roundsPerArena: BASE_ROUNDS_PER_ARENA,
        unlocks: ['short_sword'],
        transitionTarget: 'arena_beta'
    },
    {
        floorId: 2,
        arenaId: 'arena_beta',
        roundsPerArena: BASE_ROUNDS_PER_ARENA,
        unlocks: ['dual_pistols'],
        transitionTarget: 'arena_gamma'
    },
    {
        floorId: 3,
        arenaId: 'arena_gamma',
        roundsPerArena: BASE_ROUNDS_PER_ARENA,
        unlocks: ['long_sword'],
        transitionTarget: 'arena_delta'
    },
    {
        floorId: 4,
        arenaId: 'arena_delta',
        roundsPerArena: BASE_ROUNDS_PER_ARENA,
        unlocks: ['mini_gun'],
        transitionTarget: 'arena_epsilon'
    }
];

export function getLevelConfig(floor) {
    const floorIndex = Math.max(1, floor);
    const template = levels[(floorIndex - 1) % levels.length];

    return {
        floorId: floorIndex,
        arenaId: template.arenaId,
        roundsPerArena: template.roundsPerArena,
        unlocks: [...template.unlocks],
        transitionTarget: template.transitionTarget,
        enemyScaling: {
            health: 1 + (floorIndex - 1) * 0.15,
            damage: 1 + (floorIndex - 1) * 0.1,
            speed: 1 + (floorIndex - 1) * 0.05
        }
    };
}
