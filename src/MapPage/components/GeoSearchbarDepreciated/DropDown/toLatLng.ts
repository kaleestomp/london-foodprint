import { type LocationResult } from '../fetchHooks/useGeoSearch';

const toLatLng = (result: LocationResult): { lat: number; lng: number } | null => {
    const lat = Number.parseFloat(result.lat);
    const lng = Number.parseFloat(result.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return null;
    }
    return { lat, lng };
};

export default toLatLng;