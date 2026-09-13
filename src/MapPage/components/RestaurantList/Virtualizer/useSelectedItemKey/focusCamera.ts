import { useEffect, useMemo } from 'react';
import type * as maplibregl from 'maplibre-gl';

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
        // SKIP IF SELECTION DID NOT COME FROM THE LIST
        if (selectionSource !== 'list') return;
        // ON MOBILE, SKIP IF DRAWER IS CLOSED
        if (isMobile && isClosed) return;
        // ON DESKTOP, SKIP IF ITEM IS ALREADY IN VIEW
        if (!isMobile && map.getBounds().contains([selectedItem.lon, selectedItem.lat])) return;
        const zoom = Math.max(map.getZoom(), 11);
        map.easeTo({
            center: [selectedItem.lon, selectedItem.lat],
            zoom,
            padding: { top: 0, right: 0, bottom: bottomPadding, left: 0 },
            duration: 800,
        });
    }, [mapRef, selectedItem, bottomPadding, isMobile, isClosed, selectionSource]);
}

export default useFocusCamera;