import type * as maplibregl from 'maplibre-gl';

const BUILDING_LAYER_ID = '3d-buildings';
const BUILDING_SOURCE_ID = 'maptiler_planet';
const MAPTILER_KEY = (import.meta.env as Record<string, string | undefined>).VITE_MAPTILER_KEY;

const load3dBuildings = (
    map: maplibregl.Map
): void => {
    const addBuildings = () => {
        if (map.getPitch() <= 0 || map.getLayer(BUILDING_LAYER_ID)) return;

        const style = map.getStyle();
        if (!style) return;

        if (!map.getSource(BUILDING_SOURCE_ID)) {
            if (!MAPTILER_KEY) return;
            map.addSource(BUILDING_SOURCE_ID, {
                type: 'vector',
                url: `https://api.maptiler.com/tiles/v4/tiles.json?key=${MAPTILER_KEY}`,
            });
        }

        const labelLayerId = style.layers?.find(
            (layer) => layer.type === 'symbol' && Boolean(layer.layout?.['text-field'])
        )?.id;

        map.addLayer({
            id: BUILDING_LAYER_ID,
            source: BUILDING_SOURCE_ID,
            'source-layer': 'building',
            type: 'fill-extrusion',
            filter: ['!has', 'hide_3d'],
            minzoom: 15,
            paint: {
                // 'fill-extrusion-color': darkMode ? '#384261' : '#c9c5b9'
                'fill-extrusion-color': 'hsl(44,14%,79%)',
                'fill-extrusion-height': {
                    property: 'height',
                    type: 'identity',
                },
                'fill-extrusion-opacity': 0.6,
            },
        }, labelLayerId);
    };

    const removeBuildings = () => {
        if (map.getLayer(BUILDING_LAYER_ID)) {
            map.removeLayer(BUILDING_LAYER_ID);
        }
    };

    const handlePitch = () => {
        if (map.getPitch() > 0) {
            addBuildings();
        } else {
            removeBuildings();
        }
    };

    map.on('load', handlePitch);
    map.on('style.load', handlePitch);
    map.on('pitch', handlePitch);
};

export default load3dBuildings;