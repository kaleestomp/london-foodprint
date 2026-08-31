import { useEffect } from 'react';

import { useAppUI } from '../../../../context/AppUIContext';
import { STYLE_DARK, STYLE_BASE } from './MapStyles';

const useToggleMapMode = (
    mapRef: React.RefObject<maplibregl.Map | null>,
) => {

    const { mapMode } = useAppUI();

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapMode) return;
        map.setStyle(mapMode === 'dark' ? STYLE_DARK : STYLE_BASE);
    }, [mapMode]);
    
};

export default useToggleMapMode;