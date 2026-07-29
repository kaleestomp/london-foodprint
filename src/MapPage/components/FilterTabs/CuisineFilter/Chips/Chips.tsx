import { useCallback, useMemo, useRef, useState } from 'react';
import Chip from '@mui/material/Chip';
import {
    CUISINE_FILTER_OPTIONS,
    useSearchFilters,
} from '../../../../../context/SearchFiltersContext';
import { type CuisineHistogramEntry } from '../../../../request/useRequestCuisineHistogram/request';


import './Chips.css';

const COLLAPSED_COUNT = 16;
const EXPAND_STEP = 16;

type Props = {
    cuisineData: CuisineHistogramEntry[] | null;
};

const CuisineFilterChips: React.FC<Props> = ({ cuisineData }) => {

    const { cuisines, cuisineSelectionMode, toggleCuisine, clearCuisines } = useSearchFilters();
    const [visibleCount, setVisibleCount] = useState(COLLAPSED_COUNT);
    const wasAtBottomRef = useRef(false);
    const isExcludeMode = cuisineSelectionMode === 'exclude';
    const anyChipLabel = isExcludeMode ? 'None' : 'Any';
    const isAnyChipActive = cuisines.length === 0;

    const selectedSet = useMemo(() => new Set(cuisines), [cuisines]);
    const countsByCuisine = useMemo(() => {
        const map = new Map<string, number>();
        for (const entry of cuisineData ?? []) {
            map.set(entry.cuisine, entry.count);
        }
        return map;
    }, [cuisineData]);
    const orderedOptions = useMemo(() => {
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
    }, [countsByCuisine, selectedSet]);

    const visibleOptions = useMemo(() => {
        return orderedOptions.slice(0, visibleCount);
    }, [orderedOptions, visibleCount]);

    const hasHidden = visibleOptions.length < CUISINE_FILTER_OPTIONS.length;
    const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
        if (!hasHidden) return;
        const node = event.currentTarget;
        const isAtBottom = node.scrollTop + node.clientHeight >= node.scrollHeight;

        if (isAtBottom && !wasAtBottomRef.current) {
            setVisibleCount((prev) => Math.min(prev + EXPAND_STEP, orderedOptions.length));
        }
        wasAtBottomRef.current = isAtBottom;
    }, [hasHidden, orderedOptions.length]);

    return (
        <div className="cuisine-filter-chips-panel" onScroll={handleScroll}>
            <Chip
                label={anyChipLabel}
                clickable
                color={isExcludeMode ? (isAnyChipActive ? 'warning' : 'default') : (isAnyChipActive ? 'primaryBlack' : 'default')}
                variant={isAnyChipActive ? 'filled' : 'outlined'}
                onClick={clearCuisines}
            />
            {visibleOptions.map((option) => {
                const selected = selectedSet.has(option);
                const density = countsByCuisine.get(option) ?? 0;
                return (
                    <Chip
                        key={option}
                        label={`${option} | ${density}`}
                        clickable
                        color={selected ? (cuisineSelectionMode === 'exclude' ? 'warning' : 'primaryBlack') : 'default'}
                        variant={selected ? 'filled' : 'outlined'}
                        onClick={() => toggleCuisine(option)}
                    />
                );
            })}
        </div>
    );
};

export default CuisineFilterChips;
