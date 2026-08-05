import { useMemo } from 'react';
import { type CuisineHistogramEntry } from '../../../../request/useRequestCuisineHistogram/request';

import {
    CUISINE_FILTER_OPTIONS,
    useSearchFilters,
} from '../../../../../context/SearchFiltersContext';

const MAX_BARS = 8;
const BLUE = 'rgb(31, 130, 192)';
const GREY = 'rgba(95, 99, 104, 0.35)';
const ORANGE = '#ef6c00';

const byCount = (left: ChartEntry, right: ChartEntry): number => (
    right.count - left.count || left.cuisine.localeCompare(right.cuisine)
);

type Props = {
    cuisineData: CuisineHistogramEntry[] | null;
};
type ChartEntry = {
    cuisine: string;
    count: number;
};
const getCuisineChartData = ({ cuisineData }: Props): ChartEntry[] => {

    const { cuisines, cuisineSelectionMode } = useSearchFilters();

    const chartEntries = useMemo(() => {
        const selectedSet = new Set<string>(cuisines);
        const countsByCuisine = new Map<string, number>();

        for (const entry of cuisineData ?? []) {
            countsByCuisine.set(entry.cuisine, entry.count);
        }

        const knownEntries: ChartEntry[] = CUISINE_FILTER_OPTIONS
            .map((cuisine) => ({ cuisine, count: countsByCuisine.get(cuisine) ?? 0 }))
            .filter((entry) => entry.count > 0 || selectedSet.has(entry.cuisine));

        const knownSet = new Set(CUISINE_FILTER_OPTIONS);
        const unknownEntries: ChartEntry[] = (cuisineData ?? [])
            .filter((entry) => !knownSet.has(entry.cuisine))
            .map((entry) => ({ cuisine: entry.cuisine, count: entry.count }));

        const allEntries = [...knownEntries, ...unknownEntries].sort(byCount);
        const hasAnySelected = selectedSet.size === 0;

        let displayed = allEntries.slice(0, MAX_BARS);
        if (!hasAnySelected && cuisineSelectionMode === 'include') {
            const selectedEntries = allEntries
                .filter((entry) => selectedSet.has(entry.cuisine))
                .sort(byCount);
            const unselectedEntries = allEntries
                .filter((entry) => !selectedSet.has(entry.cuisine))
                .sort(byCount);
            displayed = [...selectedEntries, ...unselectedEntries]
                .slice(0, MAX_BARS)
                .sort(byCount);
        }

        return displayed.map((entry) => {
            const isSelected = selectedSet.has(entry.cuisine);
            const color = hasAnySelected
                ? BLUE
                : isSelected
                    ? (cuisineSelectionMode === 'exclude' ? ORANGE : BLUE)
                    : GREY;
            return {
                ...entry,
                itemStyle: {
                    color,
                    borderRadius: [0, 999, 999, 0],
                },
            };
        });
    }, [cuisines, cuisineSelectionMode, cuisineData]);

    return chartEntries
};

export default getCuisineChartData;
