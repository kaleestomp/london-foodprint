
import { useMemo } from 'react';
import { useTileQuery } from '../../../../../context/TileQueryContext';
import { useSearchFilters } from '../../../../../context/SearchFiltersContext';

type GeoBounds = {
    sw_lat: number;
    sw_lng: number;
    ne_lat: number;
    ne_lng: number;
    center_lat?: number;
    center_lng?: number;
    radius_m?: number;
};
const useGetSearchBounds = () : {
    geoBounds: GeoBounds | null;
    geoKey: string;
} => {
    
    // NEARBY SEARCH BOUNDS - RADIUS BASED
    // Bounding box derived from the bubble drop radius, if a bubble is active
    const { searchMask } = useSearchFilters();
    const circleBoundingBox = useMemo(() => {
        if (!searchMask) return null;

        const { lat, lng } = searchMask.center;
        const { radiusM } = searchMask;
        const earthRadiusM = 6378137;

        const latDeltaDeg = (radiusM / earthRadiusM) * (180 / Math.PI);
        const cosLat = Math.max(Math.cos((lat * Math.PI) / 180), 1e-6);
        const lngDeltaDeg = (radiusM / (earthRadiusM * cosLat)) * (180 / Math.PI);

        return {
            sw_lat: lat - latDeltaDeg,
            sw_lng: lng - lngDeltaDeg,
            ne_lat: lat + latDeltaDeg,
            ne_lng: lng + lngDeltaDeg,
            center_lat: searchMask?.center.lat,
            center_lng: searchMask?.center.lng,
            radius_m: searchMask?.radiusM,
        };
    }, [searchMask]);

    // VIEWPORT SEARCH BOUNDS - ACTIVE VIEW BASED
    // Bounding box from the last tile query viewport (only used when no bubble is active)
    const { viewportParams } = useTileQuery();
    const viewportBoundingBox = useMemo(() => {
        if (searchMask || !viewportParams) return null;
        return {
            sw_lat: viewportParams.sw_lat,
            sw_lng: viewportParams.sw_lng,
            ne_lat: viewportParams.ne_lat,
            ne_lng: viewportParams.ne_lng,
        };
    }, [viewportParams, searchMask]);

    // SELECT SEARCH BOUNDS
    const geoBounds = circleBoundingBox ?? viewportBoundingBox;

    // GEOGRAPHIC SCOPE KEY
    // Stable string key representing the current geographic scope 
    // — changes trigger page reset
    const geoKey = useMemo(() => {
        if (searchMask) {
            const { lat, lng } = searchMask.center;
            return `bubble:${lat}:${lng}:${searchMask.radiusM}`;
        }
        if (!viewportParams) return '';
        const { sw_lat, sw_lng, ne_lat, ne_lng } = viewportParams;
        return `viewport:${sw_lat}:${sw_lng}:${ne_lat}:${ne_lng}`;
    }, [searchMask, viewportParams]);

    return { geoBounds, geoKey };
}

export default useGetSearchBounds;