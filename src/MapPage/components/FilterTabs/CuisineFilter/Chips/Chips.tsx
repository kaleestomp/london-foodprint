import { useMemo, useState } from 'react';
import type L from 'leaflet';
import Chip from '@mui/material/Chip';
import {
    CUISINE_FILTER_OPTIONS,
    useSearchFilters,
} from '../../../../../context/SearchFiltersContext';
import getCuisineDensity from './getCuisineDensity';

import './Chips.css';

const COLLAPSED_COUNT = 6;
const EXPAND_STEP = 6;

type Props = {
    mapRef: React.RefObject<L.Map | null>;
};

const CuisineFilterChips: React.FC<Props> = ({ mapRef }) => {
    const {
        cuisines,
        cuisineSelectionMode,
        toggleCuisine,
        clearCuisines,
    } = useSearchFilters();
    const [visibleCount, setVisibleCount] = useState(COLLAPSED_COUNT);
    const { res } = getCuisineDensity({ mapRef, isGlobal: false });
    const isExcludeMode = cuisineSelectionMode === 'exclude';
    const anyChipLabel = isExcludeMode ? 'None' : 'Any';

    const selectedSet = useMemo(() => new Set(cuisines), [cuisines]);
    const countsByCuisine = useMemo(() => {
        const map = new Map<string, number>();
        for (const entry of res?.cuisine_histogram ?? []) {
            map.set(entry.cuisine, entry.count);
        }
        return map;
    }, [res]);
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

    return (<>
        <Chip
            label={anyChipLabel}
            clickable
            color={isExcludeMode ? 'warning' : (cuisines.length === 0 ? 'primary' : 'default')}
            variant={isExcludeMode ? 'filled' : (cuisines.length === 0 ? 'filled' : 'outlined')}
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
                    color={selected ? (cuisineSelectionMode === 'exclude' ? 'warning' : 'primary') : 'default'}
                    variant={selected ? 'filled' : 'outlined'}
                    onClick={() => toggleCuisine(option)}
                />
            );
        })}
        {hasHidden ? (
            <Chip
                label="+"
                clickable
                variant="outlined"
                className="cuisine-filter-panel__toggle-chip"
                onClick={() => setVisibleCount((prev) => Math.min(prev + EXPAND_STEP, orderedOptions.length))}
                aria-label="Show more cuisines"
            />
        ) : null}
        {visibleCount > COLLAPSED_COUNT ? (
            <Chip
                label="-"
                clickable
                variant="outlined"
                className="cuisine-filter-panel__toggle-chip"
                onClick={() => setVisibleCount(COLLAPSED_COUNT)}
                aria-label="Collapse cuisines"
            />
        ) : null}
    </>);
};

export default CuisineFilterChips;
