const EARTH_RADIUS_M = 6371000;

const toRadians = (degrees: number): number => degrees * Math.PI / 180;

const calculateDistanceM = (
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): number => {
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLon = toRadians(to.lng - from.lng);
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);
  const haversine = Math.sin(deltaLat / 2) ** 2
    + Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLon / 2) ** 2;

  return EARTH_RADIUS_M * 2 * Math.asin(Math.sqrt(haversine));
};

export default calculateDistanceM;