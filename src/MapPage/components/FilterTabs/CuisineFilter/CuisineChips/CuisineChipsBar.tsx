import { useMemo, useState } from 'react';
import Chip from '@mui/material/Chip';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
import { type CuisineHistogramEntry } from '../../../../request/useRequestCuisineHistogram/request';
import { sortByDensityDesc } from './sortOptions';
import CuisineChip from './CuisineChip/CuisineChip';

import './CuisineChipsBar.css';

/**
 * Cuisine chips displayed as a horizontal bar chart: one left-aligned chip
 * per row, with its width representing the cuisine's relative count.
 */
const CuisineChipsBar: React.FC<{
    cuisineData: CuisineHistogramEntry[] | null;
}> = ({ cuisineData }) => {
    const { cuisines, cuisineSelectionMode, addCuisine } = useSearchFilters();
    const [showZeroCount, setShowZeroCount] = useState(false);

    const countsByCuisine = useMemo(() => {
        const map = new Map<string, number>();
        for (const entry of cuisineData ?? []) {
            map.set(entry.cuisine, entry.count);
        }
        return map;
    }, [cuisineData]);

    const orderedOptions = useMemo(
        () => sortByDensityDesc(countsByCuisine),
        [countsByCuisine],
    );

    const visibleOptions = useMemo(
        () => orderedOptions.filter((option) => (countsByCuisine.get(option) ?? 0) > 0),
        [orderedOptions, countsByCuisine],
    );
    const hiddenOptions = useMemo(
        () => orderedOptions.filter((option) => (countsByCuisine.get(option) ?? 0) === 0),
        [orderedOptions, countsByCuisine],
    );

    const selectedSet = useMemo(() => new Set(cuisines), [cuisines]);
    const displayedOptions = showZeroCount ? orderedOptions : visibleOptions;
    const highestCount = Math.max(
        ...displayedOptions.map((option) => countsByCuisine.get(option) ?? 0),
        0,
    );
    const maxCount = Math.max(10, Math.ceil(highestCount / 10) * 10);

    return (
        <div className="cuisine-filter-chips-bar-panel">
            {displayedOptions.map((option) => {
                const selected = cuisineSelectionMode === 'exclude'
                    ? !selectedSet.has(option)
                    : selectedSet.has(option);
                const count = countsByCuisine.get(option) ?? 0;
                const width = `${Math.max((count / maxCount) * 100, count > 0 ? 12 : 6)}%`;

                return (
                    <CuisineChip
                        key={option}
                        cuisine={option}
                        count={count}
                        selected={selected}
                        width={width}
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

export default CuisineChipsBar;