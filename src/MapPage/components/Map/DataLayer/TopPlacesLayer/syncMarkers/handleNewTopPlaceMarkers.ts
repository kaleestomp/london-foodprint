import maplibregl from 'maplibre-gl';

import type { TopPlaceItem } from '../../../../../request/useRequestTopPlaces/request';
import TopPlacePin, { clearTopPlacePinTransitions, restartTopPlacePinEnter } from './markers/TopPlacePin';
import type { MarkerLifecycleCache } from './markerLifecycle/markerLifecycle';
import { refreshMarkerLifecycle } from './markerLifecycle/markerLifecycle';
import { cancelScheduledRemoval } from './markerLifecycle/scheduleRemoval';


const handleNewTopPlaceMarkers = ({ activeMarkers, map, topPlaces, cache, onClick, suppressedId, now }: {
    topPlaces: TopPlaceItem[];
    cache: MarkerLifecycleCache;
    activeMarkers: Map<string, maplibregl.Marker>;
    onClick: (placeId: string) => void;
    suppressedId: string | null;
    map: maplibregl.Map;
    now: number;
}): Map<string, maplibregl.Marker> => {

    topPlaces.forEach((place) => {

        // SUPPRESSED MARKER HANDLING
        if (suppressedId !== null && place.id === suppressedId) {
            // REMOVE MARKER IF IT EXISTS IN THE LAYER
            const cached = cache.get(place.id);
            if (cached) {
                cached.marker.remove();
                cache.delete(place.id);
            }
            return;
        }

        // CREATE / REUSE MARKER 
        const cached = cache.get(place.id);
        const marker = cached?.marker ?? new maplibregl.Marker({
            element: TopPlacePin(place.id, place.cuisine_type ?? undefined),
            anchor: 'center',
        }).setLngLat([place.lon, place.lat]);

        // CANCEL SCHEDULED REMOVAL OF CACHED MARKER
        if (cached) { // If cache hits
            cancelScheduledRemoval(cached);
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
        if (cached && !wasOnLayer) {
            clearTopPlacePinTransitions(marker);
            restartTopPlacePinEnter(marker);
        }

        // START LIFECYCLE
        refreshMarkerLifecycle({ cache, marker, key: place.id, now });
        
        // ADD MARKER TO SET
        activeMarkers.set(place.id, marker);

    });

    return activeMarkers;
};

export default handleNewTopPlaceMarkers;
