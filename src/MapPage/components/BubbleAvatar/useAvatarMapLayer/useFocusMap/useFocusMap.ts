import { useEffect, useRef } from 'react';
import type maplibregl from 'maplibre-gl';

import getVisibleMapTargetScreenPoint from '../../MapNavigation/getVisibleMapTargetScreenPoint';
import { ZOOM_LEVEL } from '../../config';
import useMapViewportNavigation from '../../MapNavigation/useMapViewportNavigation';
import { usePullUpPanelMetrics } from '../../../PullUpPanel/SnapHooks/PullUpPanelSnapContext';
import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
import { useIsMobileCtx } from '../../../../../context/IsMobileContext';

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

    const isMobile = useIsMobileCtx();
    const { panelHeight, translateY } = usePullUpPanelMetrics();
    const pullUpPanelRef = useRef({ isMobile, panelHeight, translateY });
    useEffect(() => { pullUpPanelRef.current = { isMobile, panelHeight, translateY } }, [isMobile, panelHeight, translateY]);

    const { searchMask } = useSearchFilters();
    const { focusMap } = useMapViewportNavigation({ mapRef });

    useEffect(() => {
        const map = mapRef.current;
        const {center} = searchMask ?? {};
        if (!map || !center) return;

        // FOCUS MAP TO LOCATION
        const { lat, lng } = center;
        const { isMobile, panelHeight, translateY } = pullUpPanelRef.current;
        const targetScreenPoint = getVisibleMapTargetScreenPoint( map, isMobile, panelHeight, translateY);
        focusMap({ target: { lat, lng }, method: 'setView', zoom: ZOOM_LEVEL, animate: true, targetScreenPoint });

    },[searchMask, mapRef, focusMap]);
    
};

export default useFocusMap;
