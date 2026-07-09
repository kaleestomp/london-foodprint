import { useMemo } from 'react';
import { useSearchFilters } from '../../../context/SearchFiltersContext';

const getCuisineCountLabel = (): string => {
    const { cuisines, cuisineSelectionMode } = useSearchFilters();
    return useMemo(() => {
        if (cuisines.length === 0) return 'any';
        // if (cuisines.length === 1 && cuisineSelectionMode === 'include') return `${cuisines[0]}`;
        const prefix = cuisineSelectionMode === 'include' ? '' : '-';
        return `${prefix}${cuisines.length}`;
    }, [cuisines, cuisineSelectionMode]);
};

export default getCuisineCountLabel;
