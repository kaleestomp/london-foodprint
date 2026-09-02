import maplibregl from 'maplibre-gl';

import type { TopPlaceItem } from '../../../../../request/useRequestTopPlaces/request';
import TopPlacePin, { clearTopPlacePinTransitions, restartTopPlacePinEnter } from './markers/TopPlacePin';
import type { MarkerLifecycleEntry } from './markerLifecycle/markerLifecycle';
import { cancelScheduledRemoval } from './markerLifecycle/scheduleRemoval';

const processMarker = (
    place: TopPlaceItem,
    cachedEntry: MarkerLifecycleEntry | null,
    onClick: (placeId: string) => void,
    map: maplibregl.Map,
) => {

    // CREATE / REUSE MARKER 
    const marker = cachedEntry?.marker ?? new maplibregl.Marker({
        element: TopPlacePin(place.id, place.cuisine_type ?? undefined),
        anchor: 'center',
    }).setLngLat([place.lon, place.lat]);

    // CANCEL SCHEDULED REMOVAL OF CACHED MARKER
    if (cachedEntry) { // If cache hits
        cancelScheduledRemoval(cachedEntry);
        // Marker can be reactivated while still on-layer with an exit class
        // applied from a previous frame; clear stale transitions so it stays visible.
        clearTopPlacePinTransitions(marker);
    } else {
        // ATTACH CLICK HANDLER FOR NEW MARKERS
        marker.getElement().addEventListener('click', (event) => {
            event.stopPropagation();
            onClick(place.id);
        });
    }

    // ADD MARKER TO LAYER IF NOT ALREADY PRESENT
    const wasOnLayer = marker.getElement().isConnected;
    if (!wasOnLayer) marker.addTo(map);
    // CLEAR & RESTART ENTER ANIMATION FOR RE-ADDED MARKERS
    if (cachedEntry && !wasOnLayer) {
        clearTopPlacePinTransitions(marker);
        restartTopPlacePinEnter(marker);
    }

    return marker;
};

export default processMarker;