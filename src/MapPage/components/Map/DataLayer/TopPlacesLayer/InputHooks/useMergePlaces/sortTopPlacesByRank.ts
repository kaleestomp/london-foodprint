import { type TopPlaceItem } from '../../../../../../request/useRequestTopPlaces/request';

const sortTopPlacesByRank = (
    topPlaces: TopPlaceItem[],
): TopPlaceItem[] => {
    return [...topPlaces].sort(compareTopPlacesByRank);
};
const compareTopPlacesByRank = (left: TopPlaceItem, right: TopPlaceItem): number => {
    const leftRank = left.rank;
    const rightRank = right.rank;

    if (leftRank == null && rightRank == null) return 0;
    if (leftRank == null) return 1;
    if (rightRank == null) return -1;
    return leftRank - rightRank;
};

export default sortTopPlacesByRank;