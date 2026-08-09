import { useEffect, useRef } from 'react';
import L from 'leaflet';

import addPlaceMarkers from '../../../Map/DataLayer/DynamicPlacesLayer/usePlacesLayer/placeMarkers/addPlaceMarkers';
import useRequestNearby from '../../../../request/useRequestNearby/useRequestNearby';
import { type TilePlacePreview } from '../../../../request/useRequestTiles/request';
import selectTopPlaces from '../../../Map/DataLayer/TopPlacesLayer/InputHooks/useNearbyFetch/selectTopPlaces';
import useNearbySearchParams from './useNearbySearchParams';

/**
 * Manages all Leaflet layers for the dropped bubble avatar.
 * Reactive: watches droppedPos state — React's effect cleanup handles
 * clearing layers whenever the position changes or becomes null.
 *
 * Long-press (150 ms) on the map avatar calls onPickup(x, y), which
 * triggers useMapPickup to start a raw-pointer carry.
 */
const useNearbyPlacesLayer = (
    mapRef: React.RefObject<L.Map | null>,
    enabled?: boolean,
) => {

    const markerRef = useRef<L.Marker | null>(null);
    const layerRef = useRef<L.LayerGroup | null>(null);

    const nearbySearchParams = useNearbySearchParams();
    const hasSearchParams = nearbySearchParams !== null;
    const { res: nearbyRes, queryKey: nearbyQueryKey, responseKey: nearbyResponseKey } = useRequestNearby(nearbySearchParams);


    // Layer Created only when a search mask is active (mirrors pre-refactor gate)
    useEffect(() => {
        if (!enabled || !hasSearchParams) return;
        const map = mapRef.current;
        if (!map) return;

        const layer = L.layerGroup().addTo(map);
        layerRef.current = layer;

        return () => {
            markerRef.current = null;
            layerRef.current = null;
            layer.remove();
        };
    }, [mapRef, enabled, hasSearchParams]);

    // ── Add/replace places layer when nearby results arrive ───────────────
    useEffect(() => {
        const map = mapRef.current;
        const { lat, lng } = nearbySearchParams ?? {};
        const center = lat && lng ? L.latLng(lat, lng) : null;
        if (!map || !nearbyRes || !center) return;
        if (nearbyResponseKey !== nearbyQueryKey) return;

        if (layerRef.current) {
            map.removeLayer(layerRef.current);
            layerRef.current = null;
        }
        const layer = L.layerGroup().addTo(map);
        layerRef.current = layer;
        const topNearbyIds = new Set(selectTopPlaces(nearbyRes.data, 10).map((place) => place.id));
        const previewPlaces: TilePlacePreview[] = nearbyRes.data
            .filter((place) => !topNearbyIds.has(place.id))
            .map((place) => ({
                id: place.id,
                lat: place.lat,
                lon: place.lon,
                tier: place.rank,
            }));
        addPlaceMarkers(
            layer,
            previewPlaces,
            undefined,
            undefined,
            center,
            0,
            25, // Stagger nearby pins to avoid overlap
        );
    }, [nearbyRes, nearbyQueryKey, nearbyResponseKey, mapRef]);

};

export default useNearbyPlacesLayer;
