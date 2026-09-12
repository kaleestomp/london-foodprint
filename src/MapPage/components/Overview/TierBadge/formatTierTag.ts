const formatTierTag = (tier: number): number => {

    if (tier === 0) return 100;
    if (tier === 1) return 50;
    if (tier === 2) return 25;
    if (tier === 3) return 10;
    if (tier === 4) return 5;
    return 0;
};

export default formatTierTag;