import { useMemo } from 'react';
import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
import { type PlacesListParams } from '../../../../request/useRequestPlacesList/useRequestPlacesList';

type FilterParams = Pick<
    PlacesListParams, 
    'cuisines' | 'cost' | 'venue_type' | 'score_basis' | 'score_tier'
>;

const useGetFilterParams = (): {
    filterParams: FilterParams;
    filterKey: string;
} => {

    const { effectiveCuisines, effectivePriceRanges, 
        venueType, scoreBasis, scoreTier } = useSearchFilters();

    const filterParams = useMemo(() => ({
        cuisines: effectiveCuisines,
        cost: effectivePriceRanges,
        venue_type: venueType ?? '',
        score_basis: scoreBasis,
        score_tier: scoreTier,
    }), [effectiveCuisines, effectivePriceRanges, 
        venueType, scoreBasis, scoreTier]);

    // Stable string key representing active filters 
    // — changes trigger page reset
    const filterKey = useMemo(() => [
        [...effectiveCuisines].sort((a, b) => a.localeCompare(b)).join('|'),
        [...effectivePriceRanges].sort((a, b) => a.localeCompare(b)).join('|'),
        venueType ?? '',
        String(scoreBasis),
        String(scoreTier),
    ].join('||'), [effectiveCuisines, effectivePriceRanges, venueType, scoreBasis, scoreTier]);

    return { filterParams, filterKey };
};

export default useGetFilterParams;