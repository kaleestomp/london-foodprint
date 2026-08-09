import { useEffect, useRef } from 'react';
import { type Root } from 'react-dom/client';
import L from 'leaflet';

import useFocusMap from './useFocusMap/useFocusMap';
import addSearchRadiusMarker from './addSearchRadiusMarker/addSearchRadiusMarker';
import addAvatarMarker from './addAvatarMarker/addAvatarMarker';

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
    mapRef: React.RefObject<L.Map | null>,
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
        const { lat, lng } = center;

        // CICLE MARKER
        const removeCircleMarker = addSearchRadiusMarker( map, lat, lng, radiusM, 0 );
        // AVATAR MARKER
        const removeAvatarMarker = addAvatarMarker( map, lat, lng, reactRootRef, onPickupRef );

        // CLEAN-UP
        // runs when droppedPos changes or component unmounts
        return () => {
            removeCircleMarker();
            removeAvatarMarker();
            // Defensive: if the marker was removed before pointerup/pointercancel,
            // Leaflet dragging can remain disabled.
            map.dragging.enable();
        };
    }, [searchMask, mapRef]);
};

export default useAvatarMapLayer;
