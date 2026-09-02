import React, { useEffect, useMemo } from 'react';
import type maplibregl from 'maplibre-gl';

import { usePlaceSelection } from '../../../../../../context/PlaceSelectionContext';
import type { TopPlaceItem } from '../../../../../request/useRequestTopPlaces/request';
import useMarkerLifeCycle from '../useMarkerLifeCycle';
import keepSelectedMarkerVisisble from './keepSelectedMarkerVisisble';
import removeMarkers from './removeMarkers';

import processMarker from './processMarker';
import { refreshMarkerLifecycle } from './markerLifecycle/markerLifecycle';


const useSyncMarkers = (
    mapRef: React.RefObject<maplibregl.Map | null>,
    topPlaces: TopPlaceItem[],
    enabled?: boolean,
): React.RefObject<Map<string, maplibregl.Marker>> => {

    const { cacheRef, markersRef } = useMarkerLifeCycle(mapRef, enabled);

    // Sync Markers with TopPlaces Data
    const { selectedPlaceId, selectedLayer, reportSelectedPlaceId } = usePlaceSelection();
    const suppressSelected = useMemo(() => (
        selectedPlaceId !== null && selectedLayer !== null && selectedLayer !== 'topPlaces' ? true : false
    ), [selectedPlaceId, selectedLayer]);

    useEffect(() => {
        const map = mapRef.current;
        const cache = cacheRef.current;
        if (!enabled || !map || !Array.isArray(topPlaces)) {
            markersRef.current = new Map();
            return;
        };

        // Used to track active marker registry 
        // Created, populated and returned for EACH SYNC PASS;
        // The state is temporary therefore REF not needed; 
        const activeMarkers = new Map<string, maplibregl.Marker>();
        const now = Date.now();

        // ADD / UPDATE MARKERS
        const onClick = (placeId: string) => { reportSelectedPlaceId(placeId, 'topPlaces', 'map') };
        topPlaces.forEach((place) => {
            // SUPPRESSED MARKER HANDLING
            if (suppressSelected && place.id === selectedPlaceId) return;
            // CREATE / REUSE MARKER 
            const marker = processMarker(place, cache.get(place.id) ?? null, onClick, map);
            // START LIFECYCLE
            refreshMarkerLifecycle({ cache, marker, key: place.id, now });
            // ADD MARKER TO SET
            activeMarkers.set(place.id, marker);
        });

        // KEEP SELECTED MARKER VISIBLE
        // Keep the selected marker visible even when it is temporarily outside
        // the latest merged payload; it should only exit once unselected.
        if (selectedPlaceId !== null) {
            keepSelectedMarkerVisisble({ activeMarkers, selectedPlaceId, map, cache, now });
        }

        // SCHEDUDLE REMOVAL OF INACTIVE MARKERS + PRUNE EXPIRED CACHE
        removeMarkers({ activeMarkers, cache, now });

        markersRef.current = activeMarkers;

    }, [topPlaces, selectedPlaceId, suppressSelected, reportSelectedPlaceId]);

    return markersRef;
};

export default useSyncMarkers;
