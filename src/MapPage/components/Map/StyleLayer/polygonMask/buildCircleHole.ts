import { type LatLngTuple } from './geometry';


const toRad = (deg: number) => deg * (Math.PI / 180);
const toDeg = (rad: number) => rad * (180 / Math.PI);

const projectDestination = (
	originLat: number,
	originLng: number,
	bearingDeg: number,
	distanceM: number,
): LatLngTuple => {
	const angularDistance = distanceM / 6371000;
	const bearing = toRad(bearingDeg);
	const lat1 = toRad(originLat);
	const lng1 = toRad(originLng);
	const sinLat1 = Math.sin(lat1);
	const cosLat1 = Math.cos(lat1);
	const sinAngularDistance = Math.sin(angularDistance);
	const cosAngularDistance = Math.cos(angularDistance);
	const lat2 = Math.asin(
		sinLat1 * cosAngularDistance
		+ cosLat1 * sinAngularDistance * Math.cos(bearing),
	);
	const lng2 = lng1 + Math.atan2(
		Math.sin(bearing) * sinAngularDistance * cosLat1,
		cosAngularDistance - sinLat1 * Math.sin(lat2),
	);
	return [toDeg(lat2), toDeg(lng2)];
};

const buildCircleHole = (
	lat: number,
	lng: number,
	radiusM: number,
	segments = 64,
): LatLngTuple[] => {
	const points: LatLngTuple[] = [];
	for (let i = 0; i < segments; i += 1) {
		points.push(projectDestination(lat, lng, (i / segments) * 360, radiusM));
	}
	return points;
};

export default buildCircleHole;