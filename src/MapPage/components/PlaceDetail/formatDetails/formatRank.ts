
const formatRank = (
    rank: number | null | undefined,
    count: number | null | undefined,
): string | null => {

    if (rank === null || rank === undefined || count === null || count === undefined)
        return null;
    
    const rankPercent = `${(rank * 100).toFixed(1)}%`;
    if (rank > 0.45 && rank < 0.55)
        return `Ranked about average in the city (${rankPercent}) based on ${count} reviews`;
    else if (rank >= 0.55)
        return `Ranked below average in the city (${rankPercent}) based on ${count} reviews`;
    
    return `Ranked Top #${rankPercent} in the city based on ${count} reviews`;
};

export default formatRank;