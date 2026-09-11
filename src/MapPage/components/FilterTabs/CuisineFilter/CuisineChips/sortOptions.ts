import { CUISINE_FILTER_OPTIONS } from '../../../../../context/SearchFiltersContext';

export const sortByDensityDesc = (
    countsByCuisine: Map<string, number>,
) => {
    const byDensityDesc = (left: string, right: string): number => {
        const leftCount = countsByCuisine.get(left) ?? 0;
        const rightCount = countsByCuisine.get(right) ?? 0;
        return rightCount - leftCount || left.localeCompare(right);
    };

    return CUISINE_FILTER_OPTIONS.slice().sort(byDensityDesc);
};

export const sortOptionsBySelected = (
    countsByCuisine: Map<string, number>,
    selectedSet: Set<string>
) => {

    const byDensityDesc = (left: string, right: string): number => {
        const leftCount = countsByCuisine.get(left) ?? 0;
        const rightCount = countsByCuisine.get(right) ?? 0;
        return rightCount - leftCount || left.localeCompare(right);
    };
    const selected = CUISINE_FILTER_OPTIONS
        .filter((option) => selectedSet.has(option))
        .sort(byDensityDesc);
    const unselected = CUISINE_FILTER_OPTIONS
        .filter((option) => !selectedSet.has(option))
        .sort(byDensityDesc);

    return [...selected, ...unselected];
}