import type * as maplibregl from 'maplibre-gl';

const syncMaxPitch = (
    map: maplibregl.Map
) => {

    const maxPitch = 60; //getMaxPitchForZoom(map.getZoom());
    map.setMaxPitch(maxPitch);
    // if (map.getPitch() > maxPitch) {
    //     map.easeTo({
    //         pitch: maxPitch,
    //         duration: 500,
    //         essential: true, 
    //     });
    // }
};

// const getMaxPitchForZoom = (zoom: number): number => {
//     if (zoom < 12) return 0;
//     if (zoom < 17) return 60 * (zoom - 12) / 5;
//     else return 60;
// };

export default syncMaxPitch;