import { useEffect, useRef } from 'react';
import { type Root } from 'react-dom/client';
import type * as maplibregl from 'maplibre-gl';

import addAvatarMarker from './addAvatarMarker/addAvatarMarker';

import { useBubbleAvatarState } from '../BubbleAvatarStateContext';
import { useSearchFilters } from '../../../../context/SearchFiltersContext';

/**
 * Manages all Leaflet layers for the dropped bubble avatar.
 * Reactive: watches droppedPos state â€” React's effect cleanup handles
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
    
    // PLOT AVATAR + CIRCLE MARKER
    useEffect(() => {

        const map = mapRef.current;
        if (!map) return;
        const center = searchMask?.center;
        if (!center) return;

        const { lat, lng } = center;
        // AVATAR MARKER
        const removeAvatarMarker = addAvatarMarker( map, lat, lng, reactRootRef, onPickupRef );

        // CLEAN-UP
        // runs when droppedPos changes or component unmounts
        return () => {
            removeAvatarMarker();
            // Defensive: if the marker was removed before pointerup/pointercancel,
            // Maplibre dragging can remain disabled.
            map.dragPan.enable();
        };
    }, [searchMask, mapRef]);
};

export default useAvatarMapLayer;
