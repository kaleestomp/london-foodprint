import { useMemo } from 'react';
import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
import { type PlacesListParams } from '../../../../request/useRequestPlacesList/useRequestInfinitePlacesList';

type FilterParams = Pick<
    PlacesListParams, 
    'cuisines' | 'cost' | 'venue_type' | 'score_basis' 
>;

const useGetFilterParams = (): {
    filterParams: FilterParams;
    filterKey: string;
} => {

    const { effectiveCuisines, effectivePriceRanges, 
        venueType, scoreBasis } = useSearchFilters();

    const filterParams = useMemo(() => ({
        cuisines: effectiveCuisines,
        cost: effectivePriceRanges,
        venue_type: venueType ?? '',
        score_basis: scoreBasis,
        // score_tier: scoreTier,
    }), [effectiveCuisines, effectivePriceRanges, 
        venueType, scoreBasis]);

    // Stable string key representing active filters 
    // — changes trigger page reset
    const filterKey = useMemo(() => [
        [...effectiveCuisines].sort((a, b) => a.localeCompare(b)).join('|'),
        [...effectivePriceRanges].sort((a, b) => a.localeCompare(b)).join('|'),
        venueType ?? '',
        String(scoreBasis),
    ].join('||'), [effectiveCuisines, effectivePriceRanges, venueType, scoreBasis]);

    return { filterParams, filterKey };
};

export default useGetFilterParams;