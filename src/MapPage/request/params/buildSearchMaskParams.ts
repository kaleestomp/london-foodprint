import type { Geometry } from 'geojson';
import type { SearchMask } from '../../../context/SearchFiltersContext';

export type SearchMaskRequestParams = {
  lat?: number;
  lng?: number;
  radius_m?: number;
  search_type?: 'boundary' | 'street';
  geometry?: Geometry;
};
export const buildSearchMaskParams = (
  searchMask: SearchMask
): SearchMaskRequestParams => {

  // return {
  //   lat: searchMask.center.lat,
  //   lng: searchMask.center.lng,
  //   radius_m: searchMask.radiusM,
  // };
  
  if (searchMask.type === 'boundary' && searchMask.geometry) {
    return {
      search_type: 'boundary',
      geometry: searchMask.geometry,
    };
  }

  if (searchMask.type === 'street' && searchMask.geometry) {
    return {
      search_type: 'street',
      geometry: searchMask.geometry,
      radius_m: searchMask.radiusM,
    };
  }

  return {
    lat: searchMask.center.lat,
    lng: searchMask.center.lng,
    radius_m: searchMask.radiusM,
  };
};

export const appendSearchMaskQueryParams = (
  query: URLSearchParams,
  params: SearchMaskRequestParams,
): void => {
  if (params.lat != null) query.set('lat', String(params.lat));
  if (params.lng != null) query.set('lng', String(params.lng));
  if (params.radius_m != null) query.set('radius_m', String(params.radius_m));
  if (params.search_type != null) query.set('search_type', params.search_type);
  if (params.geometry != null) query.set('geometry', JSON.stringify(params.geometry));
};