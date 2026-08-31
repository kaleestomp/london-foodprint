import getLatLngInterval from './getLatLngInterval';

export type ViewportBounds = { sw_lat:number, sw_lng:number, ne_lat:number, ne_lng:number };

const snapDownToInterval = (value: number, interval: number): number => Number((Math.floor(value / interval) * interval).toFixed(6));
const snapUpToInterval = (value: number, interval: number): number => Number((Math.ceil(value / interval) * interval).toFixed(6));
const snapViewportLatLng = (
    bounds: ViewportBounds,
    zoomLevel: number,
    intervalFactor: number = 1,
    inset: 'lat' | 'lng' | 'inset' | 'outset' = 'outset',
): ViewportBounds => {

    const {latInterval, lngInterval} = getLatLngInterval(zoomLevel, intervalFactor);
    
    const highZoom = zoomLevel > 17; // ignore inset
    return !highZoom && inset === 'lat' ? { // inset latitude
        sw_lat: snapUpToInterval(bounds.sw_lat, latInterval), // --
        sw_lng: snapDownToInterval(bounds.sw_lng, lngInterval), // ++
        ne_lat: snapDownToInterval(bounds.ne_lat, latInterval), // --
        ne_lng: snapUpToInterval(bounds.ne_lng, lngInterval), // ++
    } : !highZoom && inset === 'lng' ? { // inset longitude
        sw_lat: snapDownToInterval(bounds.sw_lat, latInterval), // ++
        sw_lng: snapUpToInterval(bounds.sw_lng, lngInterval), // --
        ne_lat: snapUpToInterval(bounds.ne_lat, latInterval), // ++
        ne_lng: snapDownToInterval(bounds.ne_lng, lngInterval), // --
    } : !highZoom && inset === 'inset' ? { // no inset
        sw_lat: snapUpToInterval(bounds.sw_lat, latInterval), // --
        sw_lng: snapUpToInterval(bounds.sw_lng, lngInterval), // --
        ne_lat: snapDownToInterval(bounds.ne_lat, latInterval), // --
        ne_lng: snapDownToInterval(bounds.ne_lng, lngInterval), // --
    } : { // outset or high zoom
        sw_lat: snapDownToInterval(bounds.sw_lat, latInterval), // ++
        sw_lng: snapDownToInterval(bounds.sw_lng, lngInterval), // ++
        ne_lat: snapUpToInterval(bounds.ne_lat, latInterval), // ++
        ne_lng: snapUpToInterval(bounds.ne_lng, lngInterval), // ++
    };
};

export default snapViewportLatLng;