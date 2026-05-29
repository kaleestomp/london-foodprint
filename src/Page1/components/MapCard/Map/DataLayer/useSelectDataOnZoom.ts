import L from 'leaflet'; 

import { type apiResourceContract} from '../../../../request/useRequestEPDMap/request'; 
import { SCATTER_ZOOM_THRESHOLD } from '../MapTemplate';
import addMarkers from './addMarkers'; 
import addHeatmap from './addHeatmap'; 

type DataZoomLayers = {
    heatLayer: L.LayerGroup;
    scatterLayer: L.LayerGroup;
    dataZoomHandler: () => void;
};

const useSelectDataOnZoom = (map: L.Map, data: apiResourceContract[] | null): DataZoomLayers => { 

    const heatLayer = L.layerGroup();
    const scatterLayer = L.layerGroup();
    addHeatmap(heatLayer, data); 
    addMarkers(scatterLayer, data); 

    const dataZoomHandler = () => { 
        const showScatter = map.getZoom() >= SCATTER_ZOOM_THRESHOLD;
        if (showScatter) {
            if (map.hasLayer(heatLayer)) { map.removeLayer(heatLayer); }
            if (!map.hasLayer(scatterLayer)) { scatterLayer.addTo(map); }
        } else {
            if (map.hasLayer(scatterLayer)) { map.removeLayer(scatterLayer); }
            if (!map.hasLayer(heatLayer)) { heatLayer.addTo(map); }
        }
    }; 
    
    return { heatLayer, scatterLayer, dataZoomHandler };

}; 

export default useSelectDataOnZoom; 