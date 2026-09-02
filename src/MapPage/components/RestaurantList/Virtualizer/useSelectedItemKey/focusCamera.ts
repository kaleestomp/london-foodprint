import { useEffect, useMemo } from 'react';
import type maplibregl from 'maplibre-gl';

import { useDrawerState } from '../../../SlideUpDrawer/DrawerStateContext';
import { useIsMobileCtx } from '../../../../../context/IsMobileContext';

const useFocusCamera = (
    mapRef: React.RefObject<maplibregl.Map | null>, 
    selectedItem: { lon: number; lat: number } | null,
    selectionSource: 'map' | 'list' | null,
) => {
    // FOCUS CAMERA ON SELECTED ITEM
    const isMobile = useIsMobileCtx();
    const { snapPX, isClosed } = useDrawerState();
    const bottomPadding = useMemo(() => (
        isMobile && !isClosed && snapPX ? snapPX : 0
    ), [isMobile, isClosed, snapPX]);
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !selectedItem) return;
        if (selectionSource === 'map') return;
        map.easeTo({
            center: [selectedItem.lon, selectedItem.lat],
            padding: { top: 0, right: 0, bottom: bottomPadding, left: 0 },
            duration: 800,
        });
    }, [mapRef, selectedItem, bottomPadding, selectionSource]);
}

export default useFocusCamera;