import { useMemo } from 'react';
import L from 'leaflet';

import { useSearchFilters } from '../../../../../../../context/SearchFiltersContext';
import { type TopPlaceItem } from '../../../../../../request/useRequestTopPlaces/request';


type Props = {
    viewportPlaces: TopPlaceItem[] | null;
    nearbyPlaces: TopPlaceItem[] | null;
};

const useMergePlaces = ({ viewportPlaces, nearbyPlaces }: Props): TopPlaceItem[] => {

    const { searchMask } = useSearchFilters();

    // Filter out places that are outside the search mask
    const maskedviewportPlaces = useMemo(() => {
        if (!viewportPlaces) return [];
        if (!searchMask) return viewportPlaces;
        const center = L.latLng(searchMask.center.lat, searchMask.center.lng);
        const maskedPlaces = viewportPlaces.filter((place: TopPlaceItem) => {
            return L.latLng(place.lat, place.lon).distanceTo(center) > searchMask.radiusM;
        });
        
        return maskedPlaces;
    }, [viewportPlaces, searchMask]);

    // Merge the masked viewport places with the nearby places
    const mergedPlaces = useMemo(() => {
        if (!maskedviewportPlaces) return [];
        if (!nearbyPlaces) return maskedviewportPlaces;

        const merged = new Map<string, TopPlaceItem>();
        [...maskedviewportPlaces, ...nearbyPlaces].forEach((place) => {
            merged.set(place.id, place);
        });
        return [...merged.values()];
    }, [maskedviewportPlaces, nearbyPlaces]);

    return mergedPlaces;
};

export default useMergePlaces;
