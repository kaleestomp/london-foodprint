import { useRef, useEffect } from 'react';
import type maplibregl from 'maplibre-gl';

import { usePlaceSelection } from '../../../../../../context/PlaceSelectionContext';
import addTempMarker from './addTempMarker';
import { type PlacesListItem } from '../../../../../request/useRequestPlacesList/request'

const useAddTempMarker = (
    mapRef: React.RefObject<maplibregl.Map | null>,
    place: PlacesListItem | null,
    enable: boolean
) => {

    const { selectedPlaceId, selectedLayer, selectionSource } = usePlaceSelection();
    const selectedMarkerRef = useRef<{ id: string | null, marker: maplibregl.Marker | null }>({ id: null, marker: null });
    const clearSelected = () => {
        selectedMarkerRef.current.marker?.remove();
        selectedMarkerRef.current.marker = null;
        selectedMarkerRef.current.id = null;
    };

    // CLEAR MARKER IF NO LONGER SELECTED
    useEffect(() => {
        if ( selectedPlaceId === null || selectedPlaceId !== selectedMarkerRef.current.id )
            clearSelected();
    }, [selectedPlaceId]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) {
            clearSelected();
            return;
        }

        const isListOwnedSelection = selectedLayer === 'list' && selectionSource === 'list';
        if (!isListOwnedSelection) {
            clearSelected();
            return;
        }

        if (!place) {
            const shouldKeepCurrent =
                selectedPlaceId !== null &&
                selectedMarkerRef.current.id === selectedPlaceId;
            if (!shouldKeepCurrent) {
                clearSelected();
            }
            return;
        }

        if (!enable) {
            return;
        }

        if (selectedPlaceId !== place.id) {
            clearSelected();
            return;
        }

        addTempMarker(map, place, selectedMarkerRef);

    }, [mapRef, place, enable, selectedPlaceId, selectedLayer, selectionSource]);

    useEffect(() => () => {
        clearSelected();
    }, []);
};

export default useAddTempMarker;