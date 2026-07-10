type RankedPlaceLike = {
  id: string;
  rank: number | null;
};

const selectTopRankedPlaces = <T extends RankedPlaceLike>(
  places: readonly T[],
  limit = 10,
): T[] => {
  if (!Array.isArray(places) || places.length === 0 || limit <= 0) {
    return [];
  }

  return [...places]
    .sort((left, right) => {
      const leftRank = left.rank;
      const rightRank = right.rank;

      if (leftRank == null && rightRank == null) return left.id.localeCompare(right.id);
      if (leftRank == null) return 1;
      if (rightRank == null) return -1;

      if (rightRank !== leftRank) return rightRank - leftRank;
      return left.id.localeCompare(right.id);
    })
    .slice(0, limit);
};

export default selectTopRankedPlaces;
