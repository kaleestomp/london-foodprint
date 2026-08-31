const getLatLngboxFromCircle = (
    circle: { center: { lat: number; lng: number }; radiusM: number }
) => {
    
    const { lat, lng } = circle.center;
    const { radiusM } = circle;
    const earthRadiusM = 6378137;

    const latDeltaDeg = (radiusM / earthRadiusM) * (180 / Math.PI);
    const cosLat = Math.max(Math.cos((lat * Math.PI) / 180), 1e-6);
    const lngDeltaDeg = (radiusM / (earthRadiusM * cosLat)) * (180 / Math.PI);

    return {
        sw_lat: lat - latDeltaDeg,
        sw_lng: lng - lngDeltaDeg,
        ne_lat: lat + latDeltaDeg,
        ne_lng: lng + lngDeltaDeg,
        center_lat: circle?.center.lat,
        center_lng: circle?.center.lng,
        radius_m: circle?.radiusM,
    };
};

export default getLatLngboxFromCircle;