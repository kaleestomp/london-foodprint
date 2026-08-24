// import { useRef } from 'react';
import maplibregl from 'maplibre-gl';

const getSingletonIds = (
    map: maplibregl.Map,
    layerId: string
): Set<string> => {

    if (!map.getLayer(layerId)) return new Set();
    
    const singletons = map.queryRenderedFeatures(undefined, { layers: [layerId] });

    return new Set(singletons.flatMap((feature) => {
        const id = feature.properties?.id ?? feature.id;
        return id == null ? [] : [String(id)];
    }));
};

export default getSingletonIds;
