import { useMemo } from 'react';

import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
/**
 * Builds search params for nearby results from the current search mask.
 */
const useNearbySearchParams = () => {
    const { effectiveCuisines, venueType, effectivePriceRanges, scoreTier, scoreBasis, searchMask } = useSearchFilters();
    const nearbySearchParams = useMemo(() => {
        const center = searchMask?.center;
        return center ? {
            lat: center.lat,
            lng: center.lng,
            radius_m: searchMask.radiusM,
            cuisines: effectiveCuisines,
            venue_type: venueType ?? '',
            cost: effectivePriceRanges,
            score_basis: scoreBasis,
            score_tier: scoreTier,
        } : null;
    }, [
        searchMask,
        effectiveCuisines,
        venueType,
        effectivePriceRanges,
        scoreBasis,
        scoreTier,
    ]);

    return nearbySearchParams;
};

export default useNearbySearchParams;
