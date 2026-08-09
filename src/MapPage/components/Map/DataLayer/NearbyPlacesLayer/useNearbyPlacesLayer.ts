import { useEffect, useRef } from 'react';
import L from 'leaflet';

import addPlaceMarkers from '../../../Map/DataLayer/DynamicPlacesLayer/usePlacesLayer/placeMarkers/addPlaceMarkers';
import useRequestNearby from '../../../../request/useRequestNearby/useRequestNearby';
import { type TilePlacePreview } from '../../../../request/useRequestTiles/request';
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
    activeTopPlaceIdSet: Set<string> | undefined,
    enabled?: boolean,
) => {

    const markerRef = useRef<L.Marker | null>(null);
    const layerRef = useRef<L.LayerGroup | null>(null);

    const nearbySearchParams = useNearbySearchParams();
    const hasSearchParams = nearbySearchParams !== null;
    const { res, isPlaceholderData } = useRequestNearby(nearbySearchParams);

    // ── Add/replace places layer when nearby results arrive ───────────────
    useEffect(() => {

        if (!enabled || !hasSearchParams) return;

        const map = mapRef.current;
        if (!map || !res) return;
        if (isPlaceholderData) return;
        if (layerRef.current) {
            map.removeLayer(layerRef.current);
            layerRef.current = null;
        }
        const layer = L.layerGroup().addTo(map);
        layerRef.current = layer;

        const previewPlaces: TilePlacePreview[] = res.data
            .filter((place) => !activeTopPlaceIdSet?.has(place.id))
            .map((place) => ({
                id: place.id,
                lat: place.lat,
                lon: place.lon,
                tier: place.rank,
            }));
        
        const { lat, lng } = nearbySearchParams ?? {};
        const center = lat && lng ? L.latLng(lat, lng) : null;
        if (!center) return;
        addPlaceMarkers(
            layer,
            previewPlaces,
            undefined,
            undefined,
            center,
            0,
            25, // Stagger nearby pins to avoid overlap
        );

        return () => {
            const marker = markerRef.current;
            const layer = layerRef.current;
        
            markerRef.current = null;
            layerRef.current = null;
            
            if (marker) map.removeLayer(marker);
            if (layer) map.removeLayer(layer);
        };
    }, [res, isPlaceholderData, hasSearchParams, enabled]);

};

export default useNearbyPlacesLayer;
