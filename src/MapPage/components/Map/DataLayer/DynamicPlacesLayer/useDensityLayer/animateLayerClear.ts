import type maplibregl from 'maplibre-gl';
import getMergeOffsetOnExit from './markerTransitions/getMergeOffsetOnExit';
import { type TileMarkerRegistry } from './useDensityLayer';

const animateLayerClear = (
    map: maplibregl.Map,
    res: number,
    prevRes: number | null,
    outgoingMarkers: TileMarkerRegistry,
): void => {

    // Get per-tile fly-in offsets for entry and exit animations
    const zoomingIn = prevRes !== null && res > prevRes;
    const zoomingOut = prevRes !== null && res < prevRes;
    const mergeOffsets = zoomingOut ? getMergeOffsetOnExit(map, outgoingMarkers, res) : undefined;

    outgoingMarkers.forEach(({Marker, SingletonId}, tile) => {
        const pin = Marker.getElement()?.querySelector<HTMLElement>('.density-pin');
        if (!pin) return;

        pin.classList.remove('density-pin-enter', 'density-pin-fly-in');

        if (zoomingIn) {
            // EXPLODE into child markers
            pin.classList.add('density-pin-burst');

        } else if (SingletonId) { //outgoingSingletonMarkers.has(tile)
            // SINGLETON markers skips merge — just fade out.
            // To prevent flashing where singleton exist at both start and end res
            pin.classList.add('density-pin-exit');

        } else { // MERGE into parent tile on ZOOMING OUT
            const offset = mergeOffsets?.get(tile);
            if (offset) {
                pin.style.setProperty('--merge-dx', `${offset.dx.toFixed(1)}px`);
                pin.style.setProperty('--merge-dy', `${offset.dy.toFixed(1)}px`);
                pin.classList.add('density-pin-fly-out');
            } else {
                pin.classList.add('density-pin-exit');
            }
        }
    });
};

export default animateLayerClear;
