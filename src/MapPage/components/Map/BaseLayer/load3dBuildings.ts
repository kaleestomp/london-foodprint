import type maplibregl from 'maplibre-gl';

const load3dBuildings = (
    map: maplibregl.Map
): void => {
    map.once('load', () => {

        map.setSky({
            'sky-horizon-blend': 0.18,
            'sky-color': '#d9e4ea',
            'horizon-color': '#b8cad7',
            'fog-color': '#d3e0e8',
            'fog-ground-blend': 0.12,
            'horizon-fog-blend': 0.16,
        });
    });
    map.on('pitch', () => {
        const pitch = map.getPitch();
        if (pitch > 0 && !map.getLayer('3d-buildings')) {

            // Insert the layer beneath any symbol layer.
            const layers = map.getStyle().layers;
            const streetLabelId = layers.find(
                (layer) => layer.id.includes('road-label') || layer.id.includes('street-label'),
            )?.id;
            
            map.addSource('openfreemap', {
                url: `https://tiles.openfreemap.org/planet`,
                type: 'vector',
            });
            map.addLayer({
                'id': '3d-buildings',
                'source': 'openfreemap',
                'source-layer': 'building',
                'type': 'fill-extrusion',
                'minzoom': 12, //15
                'filter': ['!=', ['get', 'hide_3d'], true],
                'paint': {
                    'fill-extrusion-color': '#384261', //#D4CDB4
                    'fill-extrusion-height': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        12, //15
                        0,
                        14, //16
                        ['get', 'render_height']
                    ],
                    'fill-extrusion-base': ['case',
                        ['>=', ['get', 'zoom'], 14], //16
                        ['get', 'render_min_height'], 0
                    ]
                }
            }, streetLabelId);
            map.setPaintProperty('3d-buildings', 'fill-extrusion-vertical-gradient', true);
        } else if (pitch === 0 && map.getLayer('3d-buildings')) {
            map.removeLayer('3d-buildings');
            map.removeSource('openfreemap');
        }
    });
};

export default load3dBuildings;