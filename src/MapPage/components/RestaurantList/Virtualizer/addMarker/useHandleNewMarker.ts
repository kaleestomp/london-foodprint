import { useRef, useEffect } from 'react';
import type maplibregl from 'maplibre-gl';

import { usePlaceSelection } from '../../../../../context/PlaceSelectionContext';
import showPlaceMarker from './showPlaceMarker';
import { type PlacesListItem } from '../../../../request/useRequestPlacesList/request'

const useHandleNewMarker = (
    mapRef: React.RefObject<maplibregl.Map | null>,
    item: PlacesListItem | null,
    shouldRender: boolean
) => {

    const { selectedPlaceId } = usePlaceSelection();
    const selectedMarkerRef = useRef<maplibregl.Marker | null>(null);
    const selectedIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!selectedIdRef.current || selectedIdRef.current === selectedPlaceId) return;
        selectedMarkerRef.current?.remove();
        selectedMarkerRef.current = null;
        selectedIdRef.current = null;
    }, [selectedPlaceId]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !shouldRender || !item) {
            selectedMarkerRef.current?.remove();
            selectedMarkerRef.current = null;
            selectedIdRef.current = null;
            return;
        }

        showPlaceMarker(map, item, selectedMarkerRef);
        selectedIdRef.current = String(item.id);

        return () => {
            selectedMarkerRef.current?.remove();
            selectedMarkerRef.current = null;
            selectedIdRef.current = null;
        };

    }, [mapRef, item, shouldRender]);
};

export default useHandleNewMarker;