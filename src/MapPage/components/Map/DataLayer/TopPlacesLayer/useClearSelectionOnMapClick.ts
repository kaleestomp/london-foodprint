import { useEffect } from 'react';
import type maplibregl from 'maplibre-gl';
import { usePlaceSelection } from '../../../../../context/PlaceSelectionContext';

const useClearSelectionOnMapClick = (
    mapRef: React.RefObject<maplibregl.Map | null>,
    enabled?: boolean,
): void => {

    // Deselect Top Place on Map Click
    const { reportSelectedPlaceId } = usePlaceSelection();
    useEffect(() => {
        const map = mapRef.current;
        if (!enabled || !map) return;

        const handleMapClick = () => {
            reportSelectedPlaceId(null, null, 'map');
        };

        map.on('click', handleMapClick);
        return () => {
            map.off('click', handleMapClick);
        };
    }, [mapRef, reportSelectedPlaceId, enabled]);
};

export default useClearSelectionOnMapClick;