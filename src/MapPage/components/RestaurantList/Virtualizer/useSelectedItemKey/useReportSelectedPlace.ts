import { useEffect, useMemo, useRef } from 'react';

import { useTopPlaces } from '../../../../../context/TopPlacesContext';
import { usePlaceSelection } from '../../../../../context/PlaceSelectionContext';
import { type PlacesListItem } from '../../../../request/useRequestPlacesList/request'
import { type SelectedLayer } from '../../../../../context/PlaceSelectionContext';

const useReportSelectedPlace = (
    selectedPlace: PlacesListItem | null,
) : boolean | null => {

    const { topPlaceIdSet } = useTopPlaces();
    const lastListSelectionRef = useRef<string | null>(null);
    const isTopPlace: boolean | null = useMemo(() => {
        if (!selectedPlace) return null;
        return Boolean(topPlaceIdSet.has(selectedPlace.id));
    }, [selectedPlace, topPlaceIdSet]);

    const { selectedPlaceId, selectedLayer, selectionSource, reportSelectedPlaceId } = usePlaceSelection();
    useEffect(() => {
        // ONLY ALLOW SELECTION CLEAR IF THE SELECTION SOURCE IS LIST-OWNED
        if (!selectedPlace) {
            if (selectionSource === 'list' && (selectedPlaceId !== null || selectedLayer !== null)) {
                reportSelectedPlaceId(null, null, 'list');
            }
            lastListSelectionRef.current = null;
            return;
        }

        // Map-origin selection should be mirrored by the list, not re-reported by it.
        // This keeps marker ownership stable while users select cluster/top-place markers.
        if (selectionSource === 'map' && selectedPlaceId === selectedPlace.id) {
            lastListSelectionRef.current = selectedPlace.id;
            return;
        }

        const targetLayer: SelectedLayer = isTopPlace ? 'topPlaces' : 'list';

        // Keep ownership on the list layer for an already-selected row.
        // This prevents a fetch-driven layer flip that would replace the temporary
        // selected marker with a top-place marker mid-selection.
        if (
            selectionSource === 'list' &&
            selectedPlaceId === selectedPlace.id &&
            selectedLayer === 'list' &&
            targetLayer === 'topPlaces'
        ) {
            lastListSelectionRef.current = selectedPlace.id;
            return;
        }

        const isSameSelection = selectedPlaceId === selectedPlace.id && selectedLayer === targetLayer;
        if (isSameSelection) {
            lastListSelectionRef.current = selectedPlace.id;
            return;
        }

        const isStaleListReplayAfterMapAction =
            selectionSource === 'map' &&
            selectedPlace.id === lastListSelectionRef.current;

        if (isStaleListReplayAfterMapAction) {
            return;
        }

        // A user click on a list row is an explicit selection intent and should override a stale
        // map selection, but not replay the same row after the map has already taken control.
        reportSelectedPlaceId(selectedPlace.id, targetLayer, 'list');
        lastListSelectionRef.current = selectedPlace.id;
    }, [selectedPlace, isTopPlace, selectedPlaceId, selectedLayer, selectionSource, reportSelectedPlaceId]);

    return isTopPlace;
};

export default useReportSelectedPlace;