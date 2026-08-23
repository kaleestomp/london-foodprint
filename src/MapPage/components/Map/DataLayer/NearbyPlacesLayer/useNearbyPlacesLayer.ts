import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

import addPlaceMarkers from '../../../Map/DataLayer/DynamicPlacesLayer/usePlacesLayer/placeMarkers/addPlaceMarkers';
import useRequestNearby from '../../../../request/useRequestNearby/useRequestNearby';
import { type TilePlacePreview } from '../../../../request/useRequestTiles/request';
import useNearbySearchParams from './useNearbySearchParams';

/**
 * Manages nearby place markers on the map.
 * Reactive: watches nearby search state and cleans up the previous markers
 * whenever the result changes or the hook unmounts.
 */
const useNearbyPlacesLayer = (
    mapRef: React.RefObject<maplibregl.Map | null>,
    activeTopPlaceIdSet: Set<string> | undefined,
    enabled?: boolean,
) => {

    const markersRef = useRef<maplibregl.Marker[]>([]);

    const nearbySearchParams = useNearbySearchParams();
    const hasSearchParams = nearbySearchParams !== null;
    const { res, isPlaceholderData } = useRequestNearby(nearbySearchParams);

    // ── Add/replace places layer when nearby results arrive ───────────────
    useEffect(() => {

        if (!enabled || !hasSearchParams) return;

        const map = mapRef.current;
        if (!map || !res) return;
        if (isPlaceholderData) return;
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];

        const previewPlaces: TilePlacePreview[] = res.data
            .filter((place) => !activeTopPlaceIdSet?.has(place.id))
            .map((place) => ({
                id: place.id,
                lat: place.lat,
                lon: place.lon,
                tier: place.rank,
            }));
        
        const { lat, lng } = nearbySearchParams ?? {};
        const center = lat != null && lng != null
            ? new maplibregl.LngLat(lng, lat)
            : null;
        if (!center) return;
        const newMarkers = addPlaceMarkers(
            map,
            previewPlaces,
            undefined,
            undefined,
            center,
            0,
            25, // Stagger nearby pins to avoid overlap
        );
        markersRef.current = newMarkers.map(({ Marker }) => Marker);

        return () => {
            markersRef.current.forEach((marker) => marker.remove());
            markersRef.current = [];
        };
    }, [enabled, hasSearchParams, isPlaceholderData, res]);

};

export default useNearbyPlacesLayer;
