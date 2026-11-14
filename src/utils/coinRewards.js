export function getSurvivalCoinReward(runCoins, survivalSeconds) {
    if (!Number.isInteger(runCoins) || runCoins < 0) {
        throw new RangeError('Run coins must be a non-negative integer.');
    }

    if (!Number.isFinite(survivalSeconds) || survivalSeconds < 0) {
        throw new RangeError('Survival time must be a non-negative finite number.');
    }

    const secondsSurvived = Math.floor(survivalSeconds);

    if (secondsSurvived < 60) {
        return Math.floor(runCoins / 4);
    }

    if (secondsSurvived >= 180 && secondsSurvived <= 300) {
        return Math.floor(runCoins / 2);
    }

    if (secondsSurvived >= 540) {
        return runCoins + 1000;
    }

    return 0;
}
