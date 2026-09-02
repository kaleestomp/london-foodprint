import { useRef, useEffect } from 'react';
import type maplibregl from 'maplibre-gl';

import { usePlaceSelection } from '../../../../../../context/PlaceSelectionContext';
import addMarker from './addMarker';
import { type PlacesListItem } from '../../../../../request/useRequestPlacesList/request'

const useAddNewMarker = (
    mapRef: React.RefObject<maplibregl.Map | null>,
    place: PlacesListItem | null,
    enable: boolean
) => {

    const { selectedPlaceId } = usePlaceSelection();
    const selectedMarkerRef = useRef<{ id: string | null, marker: maplibregl.Marker | null }>({ id: null, marker: null });
    const clearSelected = () => {
        selectedMarkerRef.current.marker?.remove();
        selectedMarkerRef.current.marker = null;
        selectedMarkerRef.current.id = null;
    };
    // CLEAR MARKER IF NO LONGER SELECTED
    useEffect(() => {
        // if (!selectedMarkerRef.current.id || selectedMarkerRef.current.id === selectedPlaceId) 
        //     return; // Do not remove the marker if it is still the selected place
        if ( selectedPlaceId === null || selectedPlaceId !== selectedMarkerRef.current.id )
            clearSelected();
    }, [selectedPlaceId]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !enable || !place) {
            clearSelected();
            return;
        }

        addMarker(map, place, selectedMarkerRef);

        return () => {
            clearSelected();
        };

    }, [mapRef, place, enable]);
};

export default useAddNewMarker;