import maplibregl from 'maplibre-gl';

const sortLayerOrder = (
    map: maplibregl.Map, 
    layerIds: string[]
) => {
    layerIds.forEach((id) => {
        if (map.getLayer(id)) map.moveLayer(id);
    });
};

export default sortLayerOrder;