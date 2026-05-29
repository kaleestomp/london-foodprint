import L from 'leaflet';
import { type apiResourceContract } from '../../../request/useRequestEPDMap/request';

export const SCATTER_ZOOM_THRESHOLD = 6; 
export const WORLD_BOUNDS = L.latLngBounds([-90, -1000], [90, 1000]); 

// Keep zoom-out limited to the world extent for the current viewport size.
export const syncMinZoomToWorldExtent = (map: L.Map) => {
    const minWorldZoom = map.getBoundsZoom(WORLD_BOUNDS, true);
    map.setMinZoom(minWorldZoom);

    if (map.getZoom() < minWorldZoom) {
        map.setZoom(minWorldZoom);
    }
};

export const adjustBounds = (map: L.Map, data: apiResourceContract[] | null, bounds: L.LatLngBounds) => { 
    if (!bounds) return; 
    if (Array.isArray(data)) {
        data.forEach((product) => {
            if (typeof product.Latitude === 'number' && typeof product.Longitude === 'number') {
                bounds.extend([product.Latitude, product.Longitude]);
            }
        });
    }
    if (bounds.isValid()) { map.fitBounds(bounds.pad(0.25)); }
    map.whenReady(() => {
      map.invalidateSize();
      syncMinZoomToWorldExtent(map);
    });
};
