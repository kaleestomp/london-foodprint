
const commentRank = (
    rank: number,
    reviewCount: number | null,
): string => {
    
    const rankPercent = (Number(rank)*100).toFixed(1);
    const rankComment = `Ranked ${rankPercent}%`;
    const reviewComment =  reviewCount ? 
        `based on ${reviewCount} reviews` : '';

    return [rankComment, reviewComment].filter(Boolean).join(' ');
};

export default commentRank;