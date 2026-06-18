import { useMemo, useState } from 'react';
import Chip from '@mui/material/Chip';
import {
    CUISINE_FILTER_OPTIONS,
    useSearchFilters,
} from '../../../../../context/SearchFiltersContext';

import './Chips.css';

const COLLAPSED_COUNT = 6;

const CuisineFilterChips: React.FC = () => {
    const {
        cuisines,
        cuisineSelectionMode,
        toggleCuisine,
        clearCuisines,
    } = useSearchFilters();
    const [expanded, setExpanded] = useState(false);

    const selectedSet = useMemo(() => new Set(cuisines), [cuisines]);
    const visibleOptions = useMemo(() => {
        if (expanded) return CUISINE_FILTER_OPTIONS;
        const selectedFirst = CUISINE_FILTER_OPTIONS.filter((opt) => selectedSet.has(opt));
        const rest = CUISINE_FILTER_OPTIONS.filter((opt) => !selectedSet.has(opt));
        return [...selectedFirst, ...rest].slice(0, COLLAPSED_COUNT);
    }, [expanded, selectedSet]);

    const hasHidden = !expanded && visibleOptions.length < CUISINE_FILTER_OPTIONS.length;

    return (<>
        <Chip
            label="Any"
            clickable
            color={cuisines.length === 0 ? 'primary' : 'default'}
            variant={cuisines.length === 0 ? 'filled' : 'outlined'}
            onClick={clearCuisines}
        />
        {visibleOptions.map((option) => {
            const selected = selectedSet.has(option);
            return (
                <Chip
                    key={option}
                    label={option}
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
                onClick={() => setExpanded(true)}
                aria-label="Expand cuisines"
            />
        ) : null}
        {!hasHidden && expanded ? (
            <Chip
                label="-"
                clickable
                variant="outlined"
                className="cuisine-filter-panel__toggle-chip"
                onClick={() => setExpanded(false)}
                aria-label="Collapse cuisines"
            />
        ) : null}
    </>);
};

export default CuisineFilterChips;
