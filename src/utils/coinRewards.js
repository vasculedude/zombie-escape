export function getSurvivalCoinReward(runCoins, survivalSeconds) {
    if (!Number.isInteger(runCoins) || runCoins < 0 ||
        !Number.isFinite(survivalSeconds) || survivalSeconds < 0) {
        throw new RangeError('Run coins and survival time must be non-negative.');
    }

    if (survivalSeconds < 60) {
        return Math.floor(runCoins / 4);
    }

    if (survivalSeconds >= 180 && survivalSeconds <= 300) {
        return Math.floor(runCoins / 2);
    }

    if (survivalSeconds >= 540) {
        return runCoins + 1000;
    }

    return 0;
}
