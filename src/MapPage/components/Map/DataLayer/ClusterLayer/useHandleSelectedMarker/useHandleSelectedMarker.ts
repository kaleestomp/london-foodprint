import { useRef, useEffect } from 'react';

import { usePlaceSelection } from '../../../../../../context/PlaceSelectionContext';
import showPlaceMarker from './showPlaceMarker';

const useHandleSelectedMarker = (
    mapRef: React.RefObject<maplibregl.Map | null>,
    layerId: string,
) => {

    const { selectedPlaceId, reportSelectedPlaceId } = usePlaceSelection();
    const selectedSingletonMarkerRef = useRef<maplibregl.Marker | null>(null);
    const selectedSingletonIdRef = useRef<string | null>(null);

    useEffect(() => {
        const selectedSingletonId = selectedSingletonIdRef.current;
        if (!selectedSingletonId || selectedSingletonId === selectedPlaceId) return;

        selectedSingletonMarkerRef.current?.remove();
        selectedSingletonMarkerRef.current = null;
        selectedSingletonIdRef.current = null;
    }, [selectedPlaceId]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const handleSingletonClick = (event: maplibregl.MapLayerMouseEvent) => {

            const feature = event.features?.[0];
            const placeId = feature?.properties?.id ?? feature?.id;
            if (placeId == null) return;
            if (feature?.geometry.type !== 'Point') return;

            event.originalEvent.stopPropagation();
            showPlaceMarker(map, feature, selectedSingletonMarkerRef);

            selectedSingletonIdRef.current = String(placeId);
            reportSelectedPlaceId(String(placeId), 'cluster', 'map');
        };
        const handleSingletonMouseEnter = () => {
            map.getCanvas().style.cursor = 'pointer';
        };

        const handleSingletonMouseLeave = () => {
            map.getCanvas().style.cursor = '';
        };

        map.on('click', layerId, handleSingletonClick);
        map.on('mouseenter', layerId, handleSingletonMouseEnter);
        map.on('mouseleave', layerId, handleSingletonMouseLeave);

        return () => {
            map.off('click', layerId, handleSingletonClick);
            map.off('mouseenter', layerId, handleSingletonMouseEnter);
            map.off('mouseleave', layerId, handleSingletonMouseLeave);
            selectedSingletonMarkerRef.current?.remove();
            selectedSingletonMarkerRef.current = null;
            selectedSingletonIdRef.current = null;
            map.getCanvas().style.cursor = '';
        };

    }, [mapRef, reportSelectedPlaceId]);
};

export default useHandleSelectedMarker;