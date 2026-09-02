import { useRef, useEffect } from 'react';

import { usePlaceSelection } from '../../../../../../context/PlaceSelectionContext';
import showPlaceMarker from './showPlaceMarker';

const useHandleSelectedMarker = (
    mapRef: React.RefObject<maplibregl.Map | null>,
    layerId: string,
) => {

    const { selectedPlaceId, selectedLayer, reportSelectedPlaceId } = usePlaceSelection();
    const selectedSingletonMarkerRef = useRef<maplibregl.Marker | null>(null);
    const selectedSingletonIdRef = useRef<string | null>(null);
    // Keep the latest ownership snapshot without re-binding map listeners.
    const selectedLayerRef = useRef(selectedLayer);
    // Shared teardown path to keep marker/id refs in sync whenever selection changes.
    const clearSelectedSingletonMarker = () => {
        selectedSingletonMarkerRef.current?.remove();
        selectedSingletonMarkerRef.current = null;
        selectedSingletonIdRef.current = null;
    };

    useEffect(() => {
        selectedLayerRef.current = selectedLayer;
    }, [selectedLayer]);

    useEffect(() => {
        const selectedSingletonId = selectedSingletonIdRef.current;
        if (!selectedSingletonId || selectedSingletonId === selectedPlaceId) return;

        clearSelectedSingletonMarker();
    }, [selectedPlaceId]);

    // Selection ownership moved away from cluster (e.g. list/temp marker took over).
    // Remove any previously rendered cluster singleton marker to prevent doubled pins.
    useEffect(() => {
        if (selectedLayer === 'cluster') return;
        if (!selectedSingletonMarkerRef.current) return;

        clearSelectedSingletonMarker();
    }, [selectedLayer]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const handleSingletonClick = (event: maplibregl.MapLayerMouseEvent) => {

            const feature = event.features?.[0];
            const placeId = feature?.properties?.id ?? feature?.id;
            if (placeId == null) return;
            if (feature?.geometry.type !== 'Point') return;

            const nextPlaceId = String(placeId);
            // Ignore re-clicks on the already-selected singleton to avoid re-creating
            // the same marker and replaying enter animation.
            if (selectedLayerRef.current === 'cluster' && selectedSingletonIdRef.current === nextPlaceId) {
                event.originalEvent.stopPropagation();
                return;
            }

            event.originalEvent.stopPropagation();
            showPlaceMarker(map, feature, selectedSingletonMarkerRef);

            selectedSingletonIdRef.current = nextPlaceId;
            reportSelectedPlaceId(nextPlaceId, 'cluster', 'map');
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
            clearSelectedSingletonMarker();
            map.getCanvas().style.cursor = '';
        };

    }, [mapRef, reportSelectedPlaceId]);
};

export default useHandleSelectedMarker;