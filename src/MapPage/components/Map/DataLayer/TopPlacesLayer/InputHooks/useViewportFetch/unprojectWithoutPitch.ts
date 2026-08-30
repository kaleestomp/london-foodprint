import { MercatorCoordinate, type LngLat } from 'maplibre-gl';
import type maplibregl from 'maplibre-gl';

const unprojectWithoutPitch = (
  map: maplibregl.Map,
  point: [number, number],
): LngLat => {
  const canvas = map.getCanvas();
  const worldSize = 512 * 2 ** map.getZoom();
  const bearingRadians = map.getBearing() * Math.PI / 180;
  const screenDeltaX = point[0] - canvas.clientWidth / 2;
  const screenDeltaY = point[1] - canvas.clientHeight / 2;
  const mapDeltaX = Math.cos(bearingRadians) * screenDeltaX - Math.sin(bearingRadians) * screenDeltaY;
  const mapDeltaY = Math.sin(bearingRadians) * screenDeltaX + Math.cos(bearingRadians) * screenDeltaY;
  const center = MercatorCoordinate.fromLngLat(map.getCenter());

  return new MercatorCoordinate(
    center.x + mapDeltaX / worldSize,
    center.y + mapDeltaY / worldSize,
  ).toLngLat();
};

export default unprojectWithoutPitch;