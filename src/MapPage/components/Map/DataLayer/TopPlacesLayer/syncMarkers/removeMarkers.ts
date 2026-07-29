import L from 'leaflet';

import { animateTopPlacePinExit } from './markers/TopPlacePin';
import { scheduleExitRemoval, cancelScheduledRemoval } from './markerLifecycle/scheduleRemoval';
import type { MarkerLifecycleCache } from './markerLifecycle/markerLifecycle';

const TOP_PLACE_PIN_CACHE_TTL_MS = 30 * 1000;
const TOP_PLACE_PIN_EXIT_MS = 360;

type Props = {
    activeMarkers: Map<string, L.Marker>;
    layer: L.LayerGroup;
    cache: MarkerLifecycleCache;
    now: number;
}

const removeMarkers = ({ activeMarkers, layer, cache, now }: Props) => {

    // SCHEDULE REMOVAL OF INACTIVE MARKERS
    for (const [placeId, entry] of cache) {
        const isActive = activeMarkers.has(placeId);
        if (!isActive && layer.hasLayer(entry.marker)) {
            scheduleExitRemoval({ layer, entry, delayMs: TOP_PLACE_PIN_EXIT_MS, onExit: animateTopPlacePinExit });
        }
    }

    // PRUNE EXPIRED MARKERS FROM CACHE
    const activeKeys = new Set(activeMarkers.keys());
    for (const [key, entry] of cache) {
        if (activeKeys.has(key)) continue;
        if (now - entry.lastSeenAt <= TOP_PLACE_PIN_CACHE_TTL_MS) continue;

        cancelScheduledRemoval(entry); // SAFETY STEP: Cancel any scheduled removal before pruning
        entry.marker.remove(); // onPrune callback
        cache.delete(key);
    }

};

export default removeMarkers;
