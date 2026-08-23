import maplibregl from 'maplibre-gl';
import { cellToLatLng } from 'h3-js';

import { type TileDensity } from '../../../../request/useRequestTiles/request';

const addHeatmap = (
    map: maplibregl.Map,
    tiles: TileDensity[],
    zoom?: number
): (() => void) => {
    const sourceId = `heatmap-source-${Date.now()}`;
    const layerId = `heatmap-layer-${Date.now()}`;
    const highestCount = Math.max(...tiles.map((tile) => tile.count), 1);
    const features = tiles.map(({ tile, count, agg_lat, agg_lon }) => {
        const [lat, lng] = agg_lat != null && agg_lon != null
            ? [agg_lat, agg_lon]
            : cellToLatLng(tile);

        return {
            type: 'Feature' as const,
            properties: { weight: Math.min(count / highestCount, 1) },
            geometry: { type: 'Point' as const, coordinates: [lng, lat] },
        };
    });

    map.addSource(sourceId, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features },
    });
    map.addLayer({
        id: layerId,
        type: 'heatmap',
        source: sourceId,
        ...(zoom == null ? {} : { maxzoom: zoom }),
        paint: {
            'heatmap-weight': ['get', 'weight'],
            'heatmap-radius': 25,
            'heatmap-opacity': 1,
            'heatmap-color': [
                'interpolate', ['linear'], ['heatmap-density'],
                0.2, '#2b83ba',
                0.4, '#abdda4',
                0.6, '#ffffbf',
                0.8, '#fdae61',
                1, '#d7191c',
            ],
        },
    });

    return () => {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
};

export default addHeatmap;