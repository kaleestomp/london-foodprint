import L from 'leaflet';
import { type TilePlacePreview } from '../../../../../../request/useRequestTiles/request';
import placeMarkerIcon from './placeMarkerIcon';

const STAGGER_STEP_MS = 28;

const addPlaceMarkers = (
  layer: L.Map | L.LayerGroup,
  places: TilePlacePreview[],
  onPlaceClick?: (placeId: string) => void,
  startOffsets?: Map<string, { dx: number; dy: number }>,
  mapCenter?: L.LatLng | null,

  entryDelayMs = 0,
  staggerCap: number = 0, // Set to > 0 to enable stagger (e.g., 20 for nearby search)
): Array<{ id: string; marker: L.Marker }> => {

  if (!Array.isArray(places) || !layer) return [];

  const newMarkers: Array<{ id: string; marker: L.Marker }> = [];

  const placesOrdered = orderPlacesByDistance(places, mapCenter || null);
  placesOrdered.forEach((place, i) => {

    // Make Marker Icon with Staggered Fly-In Animation (CSS)
    const staggerMs = entryDelayMs + Math.min(i, staggerCap) * STAGGER_STEP_MS;
    const startOffset = startOffsets?.get(place.id);
    const icon = placeMarkerIcon(staggerMs, startOffset);

    // Create Marker and Add to Layer
    const marker = L.marker([place.lat, place.lon], { icon }).addTo(layer);
    // Attach Click Handler to Marker
    if (onPlaceClick) marker.on('click', () => onPlaceClick(place.id));

    newMarkers.push({ id: place.id, marker });
  });

  return newMarkers;
};

export default addPlaceMarkers;


const orderPlacesByDistance = (places: TilePlacePreview[], point: L.LatLng | null): TilePlacePreview[] => {

  if (!point) return places;

  // Sort by distance to map center if available, so that nearby places fly in first?
  const placesOrdered = [...places];
  if (point) {
    placesOrdered.sort((a, b) => {
      const aDist = L.latLng(a.lat, a.lon).distanceTo(point);
      const bDist = L.latLng(b.lat, b.lon).distanceTo(point);
      return aDist - bDist;
    });
  }

  return placesOrdered;
}