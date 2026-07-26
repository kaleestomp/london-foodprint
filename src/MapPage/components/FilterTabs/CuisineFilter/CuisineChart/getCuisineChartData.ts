import { useMemo } from 'react';
import type L from 'leaflet';

import {
    CUISINE_FILTER_OPTIONS,
    useSearchFilters,
} from '../../../../../context/SearchFiltersContext';
import onUserRoam from '../../../Map/DataLayer/inputHooks/onUserRoam';
import useRequestCuisineHistogram from '../../../../request/useRequestCuisineHistogram/useRequestCuisineHistogram';

import './CuisineChart.css';

type Props = {
    mapRef: React.RefObject<L.Map | null>;
    isGlobal: boolean;
};

const MAX_BARS = 8;
const BLUE = 'rgb(31, 130, 192)';
const GREY = 'rgba(95, 99, 104, 0.35)';
const ORANGE = '#ef6c00';

type ChartEntry = {
    cuisine: string;
    count: number;
};

const byCount = (left: ChartEntry, right: ChartEntry): number => (
    right.count - left.count || left.cuisine.localeCompare(right.cuisine)
);

const getCuisineChartData = ({ mapRef, isGlobal }: Props) => {

    const {
        cuisines,
        cuisineSelectionMode,
        effectivePriceRanges,
        venueType,
        scoreTier,
        scoreBasis,
    } = useSearchFilters();
    const viewportParams = onUserRoam(mapRef);

    const requestParams = useMemo(() => {
        if (isGlobal) {
            return {
                scope: 'citywide' as const,
                cost: effectivePriceRanges,
                venue_type: venueType ?? '',
                score_basis: scoreBasis,
                score_tier: scoreTier,
            };
        }
        if (!viewportParams) return null;
        return {
            scope: 'view' as const,
            sw_lat: viewportParams.sw_lat,
            sw_lng: viewportParams.sw_lng,
            ne_lat: viewportParams.ne_lat,
            ne_lng: viewportParams.ne_lng,
            cost: effectivePriceRanges,
            venue_type: venueType ?? '',
            score_basis: scoreBasis,
            score_tier: scoreTier,
        };
    }, [viewportParams, effectivePriceRanges, venueType, scoreBasis, scoreTier, isGlobal]);

    const { res } = useRequestCuisineHistogram(requestParams);

    const chartEntries = useMemo(() => {
        const selectedSet = new Set<string>(cuisines);
        const countsByCuisine = new Map<string, number>();

        for (const entry of res?.cuisine_histogram ?? []) {
            countsByCuisine.set(entry.cuisine, entry.count);
        }

        const knownEntries: ChartEntry[] = CUISINE_FILTER_OPTIONS
            .map((cuisine) => ({ cuisine, count: countsByCuisine.get(cuisine) ?? 0 }))
            .filter((entry) => entry.count > 0 || selectedSet.has(entry.cuisine));

        const knownSet = new Set(CUISINE_FILTER_OPTIONS);
        const unknownEntries: ChartEntry[] = (res?.cuisine_histogram ?? [])
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
    }, [cuisines, cuisineSelectionMode, res]);

    return chartEntries
};

export default getCuisineChartData;
