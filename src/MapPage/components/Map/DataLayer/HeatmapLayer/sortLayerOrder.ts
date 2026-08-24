const BUILDING_LAYER_ID = '3d-buildings';
const CLUSTER_LAYER_ID = 'cluster-count';
import type maplibregl from 'maplibre-gl';

const sortLayerOrder = (
    map: maplibregl.Map,
    layerId: string,
) => {

    if (!map.getLayer(layerId)) return;

    const layers = map.getStyle().layers ?? [];
    const clusterIndex = layers.findIndex((layer) => layer.id === CLUSTER_LAYER_ID);
    const buildingsIndex = layers.findIndex((layer) => layer.id === BUILDING_LAYER_ID);
    const beforeId = clusterIndex >= 0
        ? CLUSTER_LAYER_ID
        : buildingsIndex >= 0
            ? layers[buildingsIndex + 1]?.id
            : undefined;
    
    map.moveLayer(layerId, beforeId);
};

export default sortLayerOrder;