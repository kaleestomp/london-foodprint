import L from 'leaflet';
import { type apiResourceContract} from '../../../../request/useRequestEPDMap/request'; 

const DENSITY_RADIUS_KM = 25;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

const distanceKm = (
  latA: number,
  lonA: number,
  latB: number,
  lonB: number
): number => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(latB - latA);
  const dLon = toRadians(lonB - lonA);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(latA)) * Math.cos(toRadians(latB)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const addHeatmap = (map: L.Map | L.LayerGroup, data: apiResourceContract[] | null) => { 
    if (Array.isArray(data)) {
        const heatPoints = buildHeatPoints(data);
        if (heatPoints.length > 0) {
        L.heatLayer(heatPoints, {
            radius: 16,
            blur: 16,
            maxZoom: 4,
            gradient: {
              0.2: '#2b83ba',
              0.4: '#abdda4',
              0.6: '#ffffbf',
              0.8: '#fdae61',
              1.0: '#d7191c'
            }
        }).addTo(map);
        }
    }
};

const buildHeatPoints = (data: apiResourceContract[]): Array<L.LatLng | L.HeatLatLngTuple> => {
  const validPoints = data.filter(
    (item) =>
      typeof item.Latitude === 'number' &&
      Number.isFinite(item.Latitude) &&
      typeof item.Longitude === 'number' &&
      Number.isFinite(item.Longitude)
  );

  if (validPoints.length === 0) {
    return [];
  }

  // Density metric: for each point, count how many other points are nearby.
  const densityValues = validPoints.map((point, index) => {
    let nearbyCount = 0;
    for (let i = 0; i < validPoints.length; i += 1) {
      if (i === index) {
        continue;
      }
      const candidate = validPoints[i];
      const distance = distanceKm(
        point.Latitude as number,
        point.Longitude as number,
        candidate.Latitude as number,
        candidate.Longitude as number
      );
      if (distance <= DENSITY_RADIUS_KM) {
        nearbyCount += 1;
      }
    }
    return nearbyCount;
  });
  const maxDensity = Math.max(...densityValues, 1);

  return validPoints.map((item, index) => [
    item.Latitude as number,
    item.Longitude as number,
    densityValues[index] / maxDensity
  ]);
};

export default addHeatmap; 


// const addHeatmap = (map: L.Map | L.LayerGroup, data: apiResourceContract[] | null) => { 
//     if (Array.isArray(data)) {
//         const heatPoints = buildHeatPoints(data);
//         if (heatPoints.length > 0) {
//         L.heatLayer(heatPoints, {
//             radius: 16,
//             blur: 16,
//             maxZoom: 4,
//             gradient: {
//               0.2: '#2b83ba',
//               0.4: '#abdda4',
//               0.6: '#ffffbf',
//               0.8: '#fdae61',
//               1.0: '#d7191c'
//             }
//         }).addTo(map);
//         }
//     }
// };

// const buildHeatPoints = (data: apiResourceContract[]): Array<L.LatLng | L.HeatLatLngTuple> => {
//   const validPoints = data.filter(
//     (item) =>
//       typeof item.Latitude === 'number' &&
//       Number.isFinite(item.Latitude) &&
//       typeof item.Longitude === 'number' &&
//       Number.isFinite(item.Longitude)
//   );

//   if (validPoints.length === 0) {
//     return [];
//   }

//   const metricValues = validPoints.map((item) =>
//     typeof item.KgCO2eq === 'number' && Number.isFinite(item.KgCO2eq) ? Math.max(item.KgCO2eq, 0) : 1
//   );
//   const maxMetric = Math.max(...metricValues, 1);

//   return validPoints.map((item, index) => [
//     item.Latitude as number,
//     item.Longitude as number,
//     metricValues[index] / maxMetric
//   ]);
// };