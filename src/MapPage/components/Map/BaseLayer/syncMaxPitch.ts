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
    if (zoom < 10) return 0;
    if (zoom < 12) return 40 * (zoom - 10) / 2;
    else return 80 * Math.min((zoom - 12) / 2, 1);
};

export default syncMaxPitch;