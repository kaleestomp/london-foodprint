import type * as maplibregl from 'maplibre-gl';

const BUILDING_LAYER_ID = '3d-buildings';
const BUILDING_SOURCE_ID = 'maptiler_planet';
const BUILDING_PATTERN_ID = 'building-pattern';
const MAPTILER_KEY = (import.meta.env as Record<string, string | undefined>).VITE_MAPTILER_KEY;

const load3dBuildings = (
    map: maplibregl.Map,
    patternImageUrl?: string,
): void => {
    const ensurePatternImage = async (): Promise<boolean> => {
        if (!patternImageUrl) return false;
        if (map.hasImage(BUILDING_PATTERN_ID)) return true;

        try {
            const image = await map.loadImage(patternImageUrl);
            if (!map.hasImage(BUILDING_PATTERN_ID)) {
                map.addImage(BUILDING_PATTERN_ID, image.data);
            }
            return true;
        } catch {
            return false;
        }
    };

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

        void ensurePatternImage().then((hasPattern) => {
            if (map.getPitch() <= 0 || map.getLayer(BUILDING_LAYER_ID)) return;

            map.addLayer({
                id: BUILDING_LAYER_ID,
                source: BUILDING_SOURCE_ID,
                'source-layer': 'building',
                type: 'fill-extrusion',
                minzoom: 14,
                layout: {
                    visibility: 'visible',
                },
                paint: {
                    'fill-extrusion-base': {
                        property: 'height_min',
                        type: 'identity',
                    },
                    'fill-extrusion-height': {
                        property: 'height',
                        type: 'identity',
                    },
                    'fill-extrusion-opacity': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        18,
                        0.8,
                        20,
                        0.6,
                    ],
                    'fill-extrusion-color': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        13,
                        'hsl(48,25%,73%)',
                        16,
                        'hsl(47,32%,77%)',
                    ],
                    'fill-extrusion-vertical-gradient': false,
                    ...(hasPattern ? { 'fill-extrusion-pattern': BUILDING_PATTERN_ID } : {}),
                },
                filter: [
                    'all',
                    ['==', ['geometry-type'], 'Polygon'],
                    [
                        'any',
                        ['==', ['get', 'underground'], false],
                        ['!', ['has', 'underground']],
                    ],
                ],
            }, labelLayerId);
        });
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