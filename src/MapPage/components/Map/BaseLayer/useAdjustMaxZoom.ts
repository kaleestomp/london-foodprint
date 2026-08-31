import { useEffect } from 'react';
import { useSearchFilters } from '../../../../context/SearchFiltersContext';
import { LONDON_MIN_ZOOM } from '../MapTemplate';
const MIN_ZOOM_ADJUSTED = 12.5;

const useAdjustMinZoom = (
    mapRef: React.RefObject<maplibregl.Map | null>,
) => {

    const { searchMask } = useSearchFilters();
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        if (searchMask)
            setTimeout(() => map.setMinZoom(MIN_ZOOM_ADJUSTED), 1000); 
            // Wait until zoom in animation completes
        else 
            map.setMinZoom(LONDON_MIN_ZOOM);

    }, [searchMask]);
};

export default useAdjustMinZoom;