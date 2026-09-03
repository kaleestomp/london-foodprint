import type maplibregl from 'maplibre-gl';
import type { CityParams } from '../../../context/CityContext';

export const isWithinCityBounds = (lat: number, lon: number, bounds: [[number, number], [number, number]]): boolean => {
  return (
    lon >= bounds[0][0] &&
    lon <= bounds[1][0] &&
    lat >= bounds[0][1] &&
    lat <= bounds[1][1]
  );
};

export const syncMinZoomToWorldExtent = (map: maplibregl.Map, cityParams?: CityParams | null) => {
  const minZoom = cityParams?.minZoom ?? 9.5;
  if (map.getZoom() < minZoom) {
    map.setZoom(minZoom);
  }
};

