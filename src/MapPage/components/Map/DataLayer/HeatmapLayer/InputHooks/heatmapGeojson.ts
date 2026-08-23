import type GeoJSON from 'geojson';

const heatmapGeojson = (
    coordinates: { id: string; lat: number; lng: number }[]
): GeoJSON.FeatureCollection<GeoJSON.Point> => {
    const totalCount = coordinates.length;
    const boost = 1 - Math.min(totalCount / 2500, 1); //if less than 2500, boost intensity
    // const nerf = 1 - Math.min(2500 / totalCount, 1); //if more than 2500, nerf intensity
    const data = {
        type: 'FeatureCollection' as const,
        features: coordinates.map(({ id, lat, lng }) => ({
            type: 'Feature' as const,
            id,
            properties: { id, weight: 1 + boost },
            geometry: {
                type: 'Point' as const,
                coordinates: [lng, lat],
            },
        })),
    };

    return data;
};

export default heatmapGeojson;