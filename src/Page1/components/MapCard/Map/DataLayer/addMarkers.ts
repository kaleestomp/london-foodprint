import L from 'leaflet';
import { type apiResourceContract} from '../../../../request/useRequestEPDMap/request'; 

const addMarkers = (map: L.Map | L.LayerGroup, data: apiResourceContract[] | null) => { 
    if (!Array.isArray(data) || !map) return;
    data.forEach((product) => {
        if (typeof product.Latitude !== 'number' || typeof product.Longitude !== 'number') return;

        const marker = L.circleMarker([product.Latitude, product.Longitude], {
            radius: 7,
            color: '#114b5f',
            weight: 2,
            fillColor: '#1a936f',
            fillOpacity: 0.9
        }).addTo(map);

        // LAYER 4: Add Popups ----
        marker.bindPopup(
            `<strong>${product.ProductName ?? 'Unknown'}</strong><br/>${product.Product ?? 'Unknown'}<br/>(${product.Latitude.toFixed(4)}, ${product.Longitude.toFixed(4)})`
        );
    });
};

export default addMarkers;