import { useEffect, useRef } from 'react';
import type * as maplibregl from 'maplibre-gl';

import { useAppUI } from '../../../../../context/AppUIContext';
import { STYLE_DARK, STYLE_LIGHT } from './MapStyles';

const useToggleMapMode = (
    mapRef: React.RefObject<maplibregl.Map | null>,
) => {
    const { mapMode } = useAppUI();
    const initialMapModeRef = useRef(mapMode);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapMode || mapMode === initialMapModeRef.current) return;
        map.setStyle(mapMode === 'dark' ? STYLE_DARK : STYLE_LIGHT);
    }, [mapMode, mapRef]);
};

export default useToggleMapMode;