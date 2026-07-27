import { CUISINE_FILTER_OPTIONS } from '../../../../../context/SearchFiltersContext';
import { type NearbyResponse } from '../../../../request/useRequestNearby/request';
import { type CuisineHistogramEntry } from '../../../../request/useRequestCuisineHistogram/request';

const UNSPECIFIED_LABEL = 'Unspecified';
const sortByCountThenLabel = <Entry extends { count: number }>(
    left: Entry,
    right: Entry,
    leftLabel: string,
    rightLabel: string,
) => {
    if (right.count !== left.count) return right.count - left.count;
    return leftLabel.localeCompare(rightLabel);
};

const aggregateCuisine = (
    nearbyRes: NearbyResponse | null,
): CuisineHistogramEntry[] => {
    const cuisineCounts = new Map<string, number>();

    for (const place of nearbyRes?.data ?? []) {
        const cuisine = place.cuisine_type ?? UNSPECIFIED_LABEL;
        cuisineCounts.set(cuisine, (cuisineCounts.get(cuisine) ?? 0) + 1);
    }
    const cuisineHistogram = [...cuisineCounts.entries()]
        .map(([cuisine, count]) => ({ cuisine, count }))
        .sort((left, right) => {
            const leftIndex = CUISINE_FILTER_OPTIONS.indexOf(left.cuisine);
            const rightIndex = CUISINE_FILTER_OPTIONS.indexOf(right.cuisine);
            if (leftIndex !== -1 && rightIndex !== -1 && leftIndex !== rightIndex) {
                return leftIndex - rightIndex;
            }
            if (leftIndex !== -1) return -1;
            if (rightIndex !== -1) return 1;
            return sortByCountThenLabel(left, right, left.cuisine, right.cuisine);
        });

    return cuisineHistogram;
};

export default aggregateCuisine;