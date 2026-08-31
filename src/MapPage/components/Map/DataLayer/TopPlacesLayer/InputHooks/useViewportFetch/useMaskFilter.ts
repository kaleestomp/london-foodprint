import { useMemo } from 'react';

import { type TopPlaceItem } from '../../../../../../request/useRequestTopPlaces/request';
import { type SearchMask } from '../../../../../../../context/SearchFiltersContext';
import { LngLat } from 'maplibre-gl';

const useMaskFilter = (
    places: TopPlaceItem[],
    searchMask: SearchMask | null
) => {

    const maskFiltered = useMemo(() => {
        if (!searchMask) return places;

        const { center, radiusM } = searchMask;
        const maskCenter = new LngLat(center.lng, center.lat);

        return places.filter((place) => (
            new LngLat(place.lon, place.lat).distanceTo(maskCenter) <= radiusM
        ));
    }, [places, searchMask]);

    return maskFiltered;
};

export default useMaskFilter;