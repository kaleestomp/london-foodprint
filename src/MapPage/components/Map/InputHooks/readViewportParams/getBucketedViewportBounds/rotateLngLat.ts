type LngLatLike = { lat: number; lng: number };

// Equirectangular approximation: accurate to well under a metre at city scale.
const rotateLngLat = (
    point: LngLatLike,
    center: LngLatLike,
    angleDeg: number,
): LngLatLike => {
    
    const angleRad = angleDeg * Math.PI / 180;
    const cosAngle = Math.cos(angleRad);
    const sinAngle = Math.sin(angleRad);
    const lngScale = Math.cos(center.lat * Math.PI / 180);

    const east = (point.lng - center.lng) * lngScale;
    const north = point.lat - center.lat;

    const rotatedEast = east * cosAngle + north * sinAngle;
    const rotatedNorth = -east * sinAngle + north * cosAngle;

    return {
        lng: center.lng + rotatedEast / lngScale,
        lat: center.lat + rotatedNorth,
    };
};

export default rotateLngLat;

// const rotatePoint = (
//     point: [number, number],
//     center: maplibregl.Point,
//     rotation: number,
// ): [number, number] => {
//     const cx = center.x ?? null;
//     const cy = center.y ?? null;
//     if (cx === null || cy === null) return point;

//     const [x, y] = point;
//     const rad = (rotation * Math.PI) / 180;
//     const cos = Math.cos(rad);
//     const sin = Math.sin(rad);
//     const nx = cos * (x - cx) - sin * (y - cy) + cx;
//     const ny = sin * (x - cx) + cos * (y - cy) + cy;
//     return [nx, ny];
// };
