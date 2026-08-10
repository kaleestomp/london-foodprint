import L from 'leaflet';
import 'leaflet.heat';
import { cellToLatLng } from 'h3-js';

import { type TileDensity } from '../../../../request/useRequestTiles/request';

const buildHeatPoints = (tiles: TileDensity[], highCount: number): L.HeatLatLngTuple[] => {
    
    return tiles.map(({ tile, count, agg_lat, agg_lon }) => {
        const weight = Math.min(count / highCount, 1);
        if (agg_lat != null && agg_lon != null) {
            return [agg_lat, agg_lon, weight];
        }

        const [lat, lng] = cellToLatLng(tile);
        return [lat, lng, weight];
    });
};

const addHeatmap = (
    layer: L.Map | L.LayerGroup,
    tiles: TileDensity[],
    zoom?: number
): L.HeatLayer => {
    const highestCount = Math.max(...tiles.map(t => t.count));
    const heatPoints = buildHeatPoints(tiles, highestCount);
    // console.log(zoom)
    const heatLayer = L.heatLayer(heatPoints, {
        // radius,
        // blur: 5,
        maxZoom: zoom,
        // max: 0.25,
        minOpacity: 0.0,
        gradient: {
            0.2: '#2b83ba',
            0.4: '#abdda4',
            0.6: '#ffffbf',
            0.8: '#fdae61',
            1.0: '#d7191c',
        }
            // 0.15: '#fff1f5',
            // 0.35: '#ffd6e4',
            // 0.55: '#ffadc9',
            // 0.75: '#ff7ea8',
            // 1.0: '#f43f8c',

    });

    heatLayer.addTo(layer);

    // const canvas = (heatLayer as any)._canvas as HTMLCanvasElement | undefined;
    // if (canvas) canvas.style.mixBlendMode = 'multiply';

    return heatLayer;
};

export default addHeatmap;