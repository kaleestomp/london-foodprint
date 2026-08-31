const toRectFeature = (
    bounds: {sw_lng: number, sw_lat: number, ne_lng: number, ne_lat: number}
): GeoJSON.Feature<GeoJSON.Polygon> => ({
    type: 'Feature',
    properties: {},
    geometry: {
        type: 'Polygon',
        coordinates: [[
            [bounds.sw_lng, bounds.sw_lat],
            [bounds.ne_lng, bounds.sw_lat],
            [bounds.ne_lng, bounds.ne_lat],
            [bounds.sw_lng, bounds.ne_lat],
            [bounds.sw_lng, bounds.sw_lat],
        ]],
    },
});

export default toRectFeature;
