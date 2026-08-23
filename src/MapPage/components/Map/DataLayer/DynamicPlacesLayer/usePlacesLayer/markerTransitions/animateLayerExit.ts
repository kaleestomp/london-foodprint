import type maplibregl from 'maplibre-gl';
import { latLngToCell, cellToLatLng } from 'h3-js';

const animateLayerExit = (
    map: maplibregl.Map,
    resolution: number,
    outgoing: Map<string, maplibregl.Marker>,
): void => {

    outgoing.forEach((place) => {
        const pin = place.getElement()?.querySelector<HTMLElement>('.density-pin');
        if (!pin) return;
        try {
            // Get Host H3 Tile Centroid
            const latlng         = place.getLngLat();
            const tileId         = latLngToCell(latlng.lat, latlng.lng, resolution);
            const [tLat, tLng]   = cellToLatLng(tileId);

            // Convert LatLng to PX Coordinates
            const tilePt = map.project([tLng, tLat]);
            const placePt = map.project(latlng);
            
            // Set CSS Vars for Fly-Out Animation
            pin.style.setProperty('--merge-dx', `${(tilePt.x - placePt.x).toFixed(1)}px`);
            pin.style.setProperty('--merge-dy', `${(tilePt.y - placePt.y).toFixed(1)}px`);
        } catch { /* skip */ }

        pin.classList.remove('density-pin-enter', 'density-pin-fly-in');
        pin.classList.add('density-pin-fly-out');
    });
};

export default animateLayerExit;