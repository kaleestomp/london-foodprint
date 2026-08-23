import maplibregl from 'maplibre-gl';
const BUILDING_LAYER_ID = '3d-buildings';

const sortLayerOrder = (
    map: maplibregl.Map, 
    layerIds: string[]
) => {
    if (layerIds.every((id) => !map.getLayer(id))) return;

    const layers = map.getStyle().layers ?? [];
    const buildingsIndex = layers.findIndex((layer) => layer.id === BUILDING_LAYER_ID);
    const beforeId = buildingsIndex >= 0
        ? layers[buildingsIndex + 1]?.id
        : undefined;

    layerIds.forEach((id) => {
        if (map.getLayer(id)) map.moveLayer(id, beforeId);
    });
};

export default sortLayerOrder;