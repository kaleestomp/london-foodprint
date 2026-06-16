import L from 'leaflet';
import { cellToLatLng } from 'h3-js';
import { type TileDensity, type TilePlacePreview } from '../../../../request/useRequestTiles/request';

export type SearchMask = {
  center: { lat: number; lng: number };
  radiusM: number;
};

export const filterDensityOutsideMask = (
  tiles: TileDensity[],
  searchMask: SearchMask | null,
): TileDensity[] => {
  if (!searchMask) return tiles;

  const center = L.latLng(searchMask.center.lat, searchMask.center.lng);
  return tiles.filter((tile) => {
    const [lat, lng] = cellToLatLng(tile.tile);
    return L.latLng(lat, lng).distanceTo(center) > searchMask.radiusM;
  });
};

export const filterPlacesOutsideMask = (
  places: TilePlacePreview[],
  searchMask: SearchMask | null,
): TilePlacePreview[] => {
  if (!searchMask) return places;

  const center = L.latLng(searchMask.center.lat, searchMask.center.lng);
  return places.filter((place) => {
    return L.latLng(place.lat, place.lon).distanceTo(center) > searchMask.radiusM;
  });
};