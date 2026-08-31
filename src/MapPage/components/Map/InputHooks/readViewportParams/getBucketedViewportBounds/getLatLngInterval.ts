// Fixed so the snap grid stays global; deriving it from the bounds would shift the grid while panning.
const REFERENCE_LAT = 51.5;
const LNG_SCALE = Math.cos(REFERENCE_LAT * Math.PI / 180);

const getLatInterval = (
    zoomBucket: number
): number => {
    if (zoomBucket <= 10) return 0.1; //0.5
    if (zoomBucket <= 10.5) return 0.05;
    if (zoomBucket <= 11) return 0.04;
    if (zoomBucket <= 11.5) return 0.035;
    if (zoomBucket <= 12) return 0.03;
    if (zoomBucket <= 12.5) return 0.025;
    if (zoomBucket <= 13) return 0.02;
    if (zoomBucket <= 13.5) return 0.015;
    if (zoomBucket <= 14) return 0.01;
    if (zoomBucket <= 14.5) return 0.0075;
    if (zoomBucket <= 15) return 0.005;
    if (zoomBucket <= 15.5) return 0.0025;
    // if (zoomBucket <= 16) return 0.0005;
    // if (zoomBucket <= 16.5) return 0.00025;
    return 0.0005;
};

const getLatLngInterval = (
    zoomBucket: number,
    intervalFactor: number = 1
): { latInterval: number, lngInterval: number } => {

    const latInterval = Number((getLatInterval(zoomBucket) * intervalFactor).toFixed(4));
    const lngInterval = Number(((latInterval / LNG_SCALE) * intervalFactor).toFixed(4)); 

    return { latInterval, lngInterval };
};

export default getLatLngInterval;