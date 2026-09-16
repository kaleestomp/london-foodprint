import type * as maplibregl from 'maplibre-gl';

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
    if (zoom < 16) return 65 * (zoom - 12) / 2;
    else return 65;
};

export default syncMaxPitch;