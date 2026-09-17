import { useEffect, useRef } from 'react';

import { usePlaceSelection } from '../../../../../context/PlaceSelectionContext';
import { type PlacesListItem } from '../../../../request/useRequestPlacesList/request'
import { type SelectedLayer } from '../../../../../context/PlaceSelectionContext';


// TRACKS LIST SELECTION 
// AND REPORT FOR PAINTING MAP MARKER
const useReportSelectionForMapPaint = (
    selectedPlace: PlacesListItem | null,
    targetLayer: SelectedLayer,
) => {

    const lastListSelectionRef = useRef<string | null>(null);
    const { selectedPlaceId, targetPaintLayer, selectionSource, reportSelectedPlaceId } = usePlaceSelection();
    
    // IF NO MATCHING LIST ITEM IS FOUND 
    // AND SELECTION WAS FROM LIST - CLEAR IT
    // THIS CAN HAPPEN AFTER LIST REFRESH
    useEffect(() => {
        if (!selectedPlace) {
            const selectionFromList = selectionSource === 'list' 
                && (selectedPlaceId !== null || targetPaintLayer !== null)
            if (selectionFromList) {
                reportSelectedPlaceId(null, null, 'list');
            }
            lastListSelectionRef.current = null;
            return;
        }
    }, [selectedPlace, selectionSource, selectedPlaceId, targetPaintLayer, reportSelectedPlaceId]);

    // REPORT VALID SELECTION TO CONTEXT
    useEffect(() => {
        // ONLY REPORT IF A MATCH IS FOUND
        if (selectedPlace === null) {
            return;
        }
        // CHECK IF MAP SELECTION IS MIRRORED BY LIST SELECTION
        // PREVENT RE-REPORTING OF SELECTION ALREADY MIRRORED
        // Map-origin selection should be mirrored by the list, not re-reported by it.
        // This keeps marker ownership stable while users select cluster/top-place markers.
        const mapSelectionMirroredByList = selectedPlace !== null
            && selectionSource === 'map' && selectedPlaceId === selectedPlace?.id;
        if (mapSelectionMirroredByList) {
            lastListSelectionRef.current = selectedPlace.id;
            return;
        }

        // LIST SELECTION - UNMATCHED TO TOP PLACE LAYER AT MOMENT OF SECTION
        // MUST RETAIN UNMATCHED TEMPORARY STATUS; 
        // TO PREVENT FETCH-DRIVEN LAYER FLIP MID-FLIGHT TO NEW MAP LOCATION
        // This can happen when new top place markers are fetched on camera move; 
        // and selected item is found in this new fetch - triggering a flicker;
        // IF SELECTION PREVIOUSLY NOT MATCHED TO TOP PLACE LAYER
        // IS MATCHED TO TOP PLACE LAYER AFTER FETCH - DO NOTHING
        const layerFlip = 
            selectedPlace !== null &&
            // Selected from list and matched currently
            selectionSource === 'list' &&
            selectedPlaceId === selectedPlace.id &&
            // Selection originally not matched to top place layer
            targetPaintLayer === 'temporary' &&
            // But not targets the top place layer
            targetLayer === 'topPlaces';
        
        if (layerFlip) {
            lastListSelectionRef.current = selectedPlace.id;
            return;
        }

        // IF SELECTION PREVIOUSLY MATCHED TO TOP PLACE LAYER
        // IS MATCHED TO TOP PLACE LAYER AGAIN - DO NOTHING
        const isSame = 
            selectedPlace !== null
            && selectedPlaceId === selectedPlace.id 
            && targetPaintLayer === targetLayer;
        if (isSame) {
            lastListSelectionRef.current = selectedPlace.id;
            return;
        }

        // IF LIST ACTION OCCURS TO SELECT AN ITEM 
        // AFTER THE SELECTION WAS TRIGGERED BY MAP ACTION - DO NOTHING
        // This allows map action to take precedence 
        // and prevents user from unselecting a map-triggered place via list
        const isStaleListReplayAfterMapAction = 
            selectedPlace !== null &&
            selectionSource === 'map' &&
            selectedPlace.id === lastListSelectionRef.current;

        if (isStaleListReplayAfterMapAction) {
            return;
        }

        // A user click on a list row is an explicit selection intent and should override a stale
        // map selection, but not replay the same row after the map has already taken control.
        reportSelectedPlaceId(selectedPlace.id, targetLayer, 'list');
        lastListSelectionRef.current = selectedPlace.id;

    }, [selectedPlace, targetLayer, selectionSource, selectedPlaceId, targetPaintLayer, reportSelectedPlaceId]);
    
};

export default useReportSelectionForMapPaint;