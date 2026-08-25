import { useEffect, useRef } from 'react';
import type maplibregl from 'maplibre-gl';

import { ZOOM_LEVEL } from '../../config';
import useMapViewportNavigation from '../../MapNavigation/useMapViewportNavigation';
import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
import useBottomPadding from '../../../MapViewportSync/useBottomPadding/useBottomPadding';

/**
 * Manages all Leaflet layers for the dropped bubble avatar.
 * Reactive: watches droppedPos state — React's effect cleanup handles
 * clearing layers whenever the position changes or becomes null.
 *
 * Long-press (150 ms) on the map avatar calls onPickup(x, y), which
 * triggers useMapPickup to start a raw-pointer carry.
 */
const useFocusMap = (
    mapRef: React.RefObject<maplibregl.Map | null>,
) => {

    const { searchMask } = useSearchFilters();
    const { focusMap } = useMapViewportNavigation({ mapRef });
    const bottomPadding = useBottomPadding(mapRef);
    const lastFocusedCenterKeyRef = useRef<string>('');

    useEffect(() => {
        const map = mapRef.current;
        const {center} = searchMask ?? {};
        if (!map || !center) {
            lastFocusedCenterKeyRef.current = '';
            return;
        }

        // Avoid focus calls when bottom padding changes 
        // (e.g., due to pull-up panel openning / closing)
        const centerKey = `${center.lat}|${center.lng}`;
        if (lastFocusedCenterKeyRef.current === centerKey) return;

        // FOCUS MAP TO LOCATION
        const { lat, lng } = center;
        focusMap({
            target: { lat, lng },
            method: 'setView',
            zoom: ZOOM_LEVEL,
            animate: true,
            padding: {
                top: 0,
                right: 0,
                bottom: bottomPadding,
                left: 0,
            },
        });
        lastFocusedCenterKeyRef.current = centerKey;

    },[searchMask, mapRef, focusMap, bottomPadding]);
    
};

export default useFocusMap;
