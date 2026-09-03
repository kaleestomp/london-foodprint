import { useEffect } from 'react';
import { useSearchFilters } from '../../../../context/SearchFiltersContext';
import { useCityContext } from '../../../../context/CityContext';
const MIN_ZOOM_ADJUSTED = 12.5;

const useAdjustMinZoom = (
    mapRef: React.RefObject<maplibregl.Map | null>,
) => {
    const { cityParams } = useCityContext();
    const { searchMask } = useSearchFilters();

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        const defaultMinZoom = cityParams?.minZoom ?? 9.5;

        if (searchMask)
            setTimeout(() => map.setMinZoom(MIN_ZOOM_ADJUSTED), 1000); 
            // Wait until zoom in animation completes
        else 
            map.setMinZoom(defaultMinZoom);

    }, [searchMask, cityParams]);
};

export default useAdjustMinZoom;