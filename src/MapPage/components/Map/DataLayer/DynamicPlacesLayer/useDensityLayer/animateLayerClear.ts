import L from 'leaflet';
import getMergeOffsetOnExit from './markerTransitions/getMergeOffsetOnExit';

const animateLayerClear = (
    map: L.Map,
    res: number,
    prevRes: number | null,
    outgoingDensityMarkers: Map<string, L.Marker>,
    outgoingSingletonMarkers: Set<string>,
): void => {

    // Get per-tile fly-in offsets for entry and exit animations
    const zoomingIn = prevRes !== null && res > prevRes;
    const zoomingOut = prevRes !== null && res < prevRes;
    const mergeOffsets = zoomingOut ? getMergeOffsetOnExit(map, outgoingDensityMarkers, res) : undefined;

    outgoingDensityMarkers.forEach((marker, tile) => {
        const pin = marker.getElement()?.querySelector<HTMLElement>('.density-pin');
        if (!pin) return;
        pin.classList.remove('density-pin-enter', 'density-pin-fly-in');

        if (zoomingIn) {
            // Tile maker explode into child markers
            pin.classList.add('density-pin-burst');

        } else if (outgoingSingletonMarkers.has(tile)) {
            // Singleton markers skips merge — just fade out.
            // To prevent flashing where singleton exist at both start and end res
            pin.classList.add('density-pin-exit');

        } else {
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
