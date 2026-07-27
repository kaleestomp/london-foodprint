import { useMemo } from 'react';

import { useSearchFilters } from '../../../../context/SearchFiltersContext';
import { type LatLng, SEARCH_RADIUS } from '../config';
/**
 * Manages all Leaflet layers for the dropped bubble avatar.
 * Reactive: watches droppedPos state — React's effect cleanup handles
 * clearing layers whenever the position changes or becomes null.
 *
 * Long-press (150 ms) on the map avatar calls onPickup(x, y), which
 * triggers useMapPickup to start a raw-pointer carry.
 */
const getNearbySearchParams = (
    droppedPos: LatLng | null,
) => {
    const { effectiveCuisines, venueType, effectivePriceRanges, scoreTier, scoreBasis } = useSearchFilters();
    // Keep onPickup fresh without invalidating the main effect
    const nearbySearchParams = useMemo(() => {
        return droppedPos ? {
        lat: droppedPos.lat,
        lng: droppedPos.lng,
        radius_m: SEARCH_RADIUS,
        cuisines: effectiveCuisines,
        venue_type: venueType ?? '',
        cost: effectivePriceRanges,
        score_basis: scoreBasis,
        score_tier: scoreTier,
    } : null 
    }, [
        droppedPos, effectiveCuisines,
        venueType, effectivePriceRanges,
        scoreBasis, scoreTier
    ]);

    return nearbySearchParams;
};

export default getNearbySearchParams;
