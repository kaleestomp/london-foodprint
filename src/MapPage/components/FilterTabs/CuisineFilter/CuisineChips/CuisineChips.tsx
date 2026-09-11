import { useMemo, useState } from 'react';
import Chip from '@mui/material/Chip';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
import { type CuisineHistogramEntry } from '../../../../request/useRequestCuisineHistogram/request';
import { sortByDensityDesc } from './sortOptions';
import CuisineChip from './CuisineChip/CuisineChip';

import './CuisineChips.css';

const CuisineFilterChips: React.FC<{
    cuisineData: CuisineHistogramEntry[] | null;
}> = ({ cuisineData }) => {

    const { cuisines, cuisineSelectionMode, addCuisine } = useSearchFilters();
    const [showZeroCount, setShowZeroCount] = useState(false);

    // CUISINE COUNTS
    const countsByCuisine = useMemo(() => {
        const map = new Map<string, number>();
        for (const entry of cuisineData ?? []) {
            map.set(entry.cuisine, entry.count);
        }
        return map;
    }, [cuisineData]);

    // ORDERED BY DENSITY
    const orderedOptions = useMemo(() => (
        sortByDensityDesc(countsByCuisine)
    ), [countsByCuisine]);

    // SPLIT VISIBLE AND HIDDEN OPTIONS
    const visibleOptions = useMemo(() => (
        orderedOptions.filter(option => (countsByCuisine.get(option) ?? 0) > 0)
    ), [orderedOptions, countsByCuisine]);
    const hiddenOptions = useMemo(() => (
        orderedOptions.filter(option => (countsByCuisine.get(option) ?? 0) === 0)
    ), [orderedOptions, countsByCuisine]);

    const selectedSet = useMemo(() => new Set(cuisines), [cuisines]);
    const displayedOptions = showZeroCount ? orderedOptions : visibleOptions;

    return (
        <div className="cuisine-filter-chips-panel">
            {displayedOptions.map((option) => {
                const selected = cuisineSelectionMode === 'exclude'
                    ? !selectedSet.has(option)
                    : selectedSet.has(option);
                const density = countsByCuisine.get(option) ?? 0;
                return (
                    <CuisineChip key={option} cuisine={option} count={density}
                        selected={selected}
                        onClick={() => addCuisine(option)}
                    />
                );
            })}
            {hiddenOptions.length > 0 && (
                <Chip
                    clickable
                    icon={showZeroCount ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    label={showZeroCount ? 'Hide empty' : 'Show empty'}
                    onClick={() => setShowZeroCount((current) => !current)}
                />
            )}
        </div>
    );
};

export default CuisineFilterChips;
