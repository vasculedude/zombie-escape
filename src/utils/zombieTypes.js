export const ZOMBIE_TYPES = Object.freeze({
    normal: Object.freeze({
        name: 'Normal',
        health: 100,
        damagePerSecond: 20,
        speed: 60,
        tint: 0xffffff,
        displaySize: 50
    }),
    runner: Object.freeze({
        name: 'Runner',
        health: 60,
        damagePerSecond: 15,
        speed: 110,
        tint: 0xff7777,
        displaySize: 46
    }),
    tank: Object.freeze({
        name: 'Tank',
        health: 250,
        damagePerSecond: 30,
        speed: 35,
        tint: 0x777777,
        displaySize: 60
    }),
    armoured: Object.freeze({
        name: 'Armoured',
        health: 150,
        damagePerSecond: 20,
        speed: 50,
        tint: 0x9ca3af,
        displaySize: 54
    }),
    boss: Object.freeze({
        name: 'Boss',
        health: 800,
        damagePerSecond: 35,
        speed: 40,
        tint: 0xb94a48,
        displaySize: 76
    })
});

export const REGULAR_ZOMBIE_TYPES = Object.freeze(['normal', 'runner']);
