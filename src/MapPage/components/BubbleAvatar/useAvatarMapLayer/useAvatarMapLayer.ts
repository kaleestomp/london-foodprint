import { useEffect, useRef } from 'react';
import { type Root } from 'react-dom/client';
import type maplibregl from 'maplibre-gl';

import useFocusMap from './useFocusMap/useFocusMap';
import addSearchRadiusMarker from './addSearchRadiusMarker/addSearchRadiusMarker';
import addAvatarMarker from './addAvatarMarker/addAvatarMarker';
import { DROP_ENTRY_DELAY_MS, ZOOM_LEVEL } from '../config';

import { useBubbleAvatarState } from '../BubbleAvatarStateContext';
import { useSearchFilters } from '../../../../context/SearchFiltersContext';

/**
 * Manages all Leaflet layers for the dropped bubble avatar.
 * Reactive: watches droppedPos state — React's effect cleanup handles
 * clearing layers whenever the position changes or becomes null.
 *
 * Long-press (150 ms) on the map avatar calls onPickup(x, y), which
 * triggers useMapPickup to start a raw-pointer carry.
 */
const useAvatarMapLayer = (
    mapRef: React.RefObject<maplibregl.Map | null>,
) => {
    
    const reactRootRef = useRef<Root | null>(null);
    const { searchMask } = useSearchFilters();

    const { handlePickup } = useBubbleAvatarState();
    const onPickupRef = useRef(handlePickup);
    useEffect(() => { onPickupRef.current = handlePickup; }, [handlePickup]);
    
    // FOCUS MAP TO LOCATION
    useFocusMap( mapRef );

    // PLOT AVATAR + CIRCLE MARKER
    useEffect(() => {

        const map = mapRef.current;
        if (!map) return;
        const {center, radiusM} = searchMask ?? {};
        if (!center || !radiusM) return;
        
        // CICLE MARKER
        const { lat, lng } = center;
        const isAlreadyAtTargetZoom = map.getZoom() === ZOOM_LEVEL;
        const entryDelayMs = isAlreadyAtTargetZoom ? 0 : DROP_ENTRY_DELAY_MS;
        const removeCircleMarker = addSearchRadiusMarker( map, lat, lng, radiusM, entryDelayMs );
        // AVATAR MARKER
        const removeAvatarMarker = addAvatarMarker( map, lat, lng, reactRootRef, onPickupRef );

        // CLEAN-UP
        // runs when droppedPos changes or component unmounts
        return () => {
            removeCircleMarker();
            removeAvatarMarker();
            // Defensive: if the marker was removed before pointerup/pointercancel,
            // Maplibre dragging can remain disabled.
            map.dragPan.enable();
        };
    }, [searchMask, mapRef]);
};

export default useAvatarMapLayer;
