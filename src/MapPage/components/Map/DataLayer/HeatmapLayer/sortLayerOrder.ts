const BUILDING_LAYER_ID = '3d-buildings';
import type maplibregl from 'maplibre-gl';

const sortLayerOrder = (
    map: maplibregl.Map,
    layerId: string,
) => {

    if (!map.getLayer(layerId)) return;

    const layers = map.getStyle().layers ?? [];
    const buildingsIndex = layers.findIndex((layer) => layer.id === BUILDING_LAYER_ID);
    const beforeId = buildingsIndex >= 0
        ? layers[buildingsIndex + 1]?.id
        : undefined;
    
    map.moveLayer(layerId, beforeId);
};

export default sortLayerOrder;