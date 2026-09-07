import React from 'react';
import type maplibregl from 'maplibre-gl';
import type { FeatureCollection, Polygon } from 'geojson';
import { MASK_LAYER_IDS, OPTIONS } from './config';

const applyMask = (
    map: maplibregl.Map,
    mask: FeatureCollection<Polygon>,
    currentMaskRef: React.RefObject<FeatureCollection<Polygon> | undefined>
) => {

    if (!map.getStyle() || !map.isStyleLoaded()) return;

    const layerExists = Boolean(map.getLayer(MASK_LAYER_IDS.fillLayerId));
    const dataUnchanged = currentMaskRef.current === mask;

    // If the layer is already set up and data hasn't changed, no work is needed
    if (layerExists && dataUnchanged) {
        return;
    }

    let existingSource = map.getSource(MASK_LAYER_IDS.sourceId) as maplibregl.GeoJSONSource | undefined;

    // Add or update source
    if (!existingSource) {
        map.addSource(MASK_LAYER_IDS.sourceId, {
            type: 'geojson',
            data: mask,
        });
        currentMaskRef.current = mask;
    } else if (!dataUnchanged) {
        existingSource.setData(mask);
        currentMaskRef.current = mask;
    }

    // Add fill layer above all basemap layers/labels if not present
    if (!map.getLayer(MASK_LAYER_IDS.fillLayerId)) {
        map.addLayer(
            {
                id: MASK_LAYER_IDS.fillLayerId,
                type: 'fill',
                source: MASK_LAYER_IDS.sourceId,
                paint: {
                    'fill-color': OPTIONS.fillColor,
                    'fill-opacity': OPTIONS.fillOpacity,
                },
            },
            undefined // Omitted/undefined appends layer to the top (above all basemap labels)
        );
    } else {
        map.setPaintProperty(MASK_LAYER_IDS.fillLayerId, 'fill-color', OPTIONS.fillColor);
        map.setPaintProperty(MASK_LAYER_IDS.fillLayerId, 'fill-opacity', OPTIONS.fillOpacity);
    }

    // Add or remove outline layer
    if (OPTIONS.showOutline) {
        if (!map.getLayer(MASK_LAYER_IDS.outlineLayerId)) {
            map.addLayer({
                id: MASK_LAYER_IDS.outlineLayerId,
                type: 'line',
                source: MASK_LAYER_IDS.sourceId,
                paint: {
                    'line-color': OPTIONS.lineColor,
                    'line-width': OPTIONS.lineWidth,
                    'line-opacity': OPTIONS.lineOpacity,
                },
            });
        } else {
            map.setPaintProperty(MASK_LAYER_IDS.outlineLayerId, 'line-color', OPTIONS.lineColor);
            map.setPaintProperty(MASK_LAYER_IDS.outlineLayerId, 'line-width', OPTIONS.lineWidth);
            map.setPaintProperty(MASK_LAYER_IDS.outlineLayerId, 'line-opacity', OPTIONS.lineOpacity);
        }
    } else if (map.getLayer(MASK_LAYER_IDS.outlineLayerId)) {
        map.removeLayer(MASK_LAYER_IDS.outlineLayerId);
    }
};

export default applyMask;