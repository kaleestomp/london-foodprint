import { useMemo } from 'react';

import { type TopPlaceItem } from '../../../../../../../request/useRequestTopPlaces/request';
import { type SearchMask } from '../../../../../../../../context/SearchFiltersContext';
import { LngLat } from 'maplibre-gl';
import isInsideBoundary from './isInsideBoundary';
import distanceToStreetM from './distanceToStreetM';

const useMaskFilter = (
    places: TopPlaceItem[],
    searchMask: SearchMask | null
) => {

    const maskFiltered = useMemo(() => {
        if (!searchMask) return places;

        const { center, radiusM, type, geometry } = searchMask;
        const maskCenter = new LngLat(center.lng, center.lat);

        return places.filter((place) => {
            const point = { lng: place.lon, lat: place.lat };

            if (type === 'boundary' && geometry) {
                return isInsideBoundary(point, geometry);
            }

            if (type === 'street' && geometry) {
                return distanceToStreetM(point, geometry) <= radiusM;
            }

            return new LngLat(place.lon, place.lat).distanceTo(maskCenter) <= radiusM;
        });
    }, [places, searchMask]);

    return maskFiltered;
};

export default useMaskFilter;