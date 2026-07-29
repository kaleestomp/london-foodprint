import L from 'leaflet';

import type { TopPlaceItem } from '../../../../../request/useRequestTopPlaces/request';
import TopPlacePin, { clearTopPlacePinTransitions, restartTopPlacePinEnter } from './markers/TopPlacePin';
import type { MarkerLifecycleCache } from './markerLifecycle/markerLifecycle';
import { refreshMarkerLifecycle } from './markerLifecycle/markerLifecycle';
import { cancelScheduledRemoval } from './markerLifecycle/scheduleRemoval';


type Props = {
    activeMarkers: Map<string, L.Marker>;
    layer: L.LayerGroup;
    topPlaces: TopPlaceItem[];
    cache: MarkerLifecycleCache;
    onPlaceClick?: (placeId: string) => void;
    now: number;
}

const addMarkers = ({ activeMarkers, layer, topPlaces, cache, onPlaceClick, now }: Props): Map<string, L.Marker> => {

    topPlaces.forEach((place) => {
        // CREATE / REUSE MARKER 
        const cached = cache.get(place.id);
        const marker = cached?.marker ?? L.marker([place.lat, place.lon], {
            icon: TopPlacePin(place?.cuisine_type ?? undefined),
            zIndexOffset: 1400,
        });

        // CANCEL SCHEDULED REMOVAL OF CACHED MARKER
        if (cached) { // If cache hits
            cancelScheduledRemoval(cached);
            // Marker can be reactivated while still on-layer with an exit class
            // applied from a previous frame; clear stale transitions so it stays visible.
            clearTopPlacePinTransitions(marker);
        }

        // ATTACH CLICK HANDLER FOR NEW MARKERS
        if (!cached && onPlaceClick) {
            marker.on('click', (event) => {
                L.DomEvent.stopPropagation(event);
                onPlaceClick(place.id);
            });
        }

        // ADD MARKER TO LAYER IF NOT ALREADY PRESENT
        const wasOnLayer = layer.hasLayer(marker);
        if (!wasOnLayer) {
            marker.addTo(layer);
        }
        // CLEAR & RESTART ENTER ANIMATION FOR RE-ADDED MARKERS
        if (cached && !wasOnLayer) {
            clearTopPlacePinTransitions(marker);
            restartTopPlacePinEnter(marker);
        }

        // START LIFECYCLE
        refreshMarkerLifecycle({ marker, cache, key: place.id, now });
        // ADD MARKER TO SET
        activeMarkers.set(place.id, marker);

    });

    return activeMarkers;
};

export default addMarkers;
