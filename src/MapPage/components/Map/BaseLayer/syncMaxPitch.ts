import type maplibregl from 'maplibre-gl';

const syncMaxPitch = (
    map: maplibregl.Map
) => {

    const maxPitch = getMaxPitchForZoom(map.getZoom());
    map.setMaxPitch(maxPitch);
    // if (map.getPitch() > maxPitch) {
    //     map.easeTo({
    //         pitch: maxPitch,
    //         duration: 500,
    //         essential: true, 
    //     });
    // }
};

const getMaxPitchForZoom = (zoom: number): number => {
    if (zoom < 12) return 0;
    if (zoom < 14) return 40 * (zoom - 12) / 2;
    else return 60 * Math.min((zoom - 14) / 2, 1);
};

export default syncMaxPitch;