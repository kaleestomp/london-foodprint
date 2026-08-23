import maplibregl from 'maplibre-gl';
import { type TilePlacePreview } from '../../../../../../request/useRequestTiles/request';
import placeMarkerIcon from './placeMarkerIcon';

const STAGGER_STEP_MS = 28;

const addPlaceMarkers = (
  map: maplibregl.Map,
  places: TilePlacePreview[],
  onPlaceClick?: (placeId: string) => void,
  startOffsets?: Map<string, { dx: number; dy: number }>,
  mapCenter?: maplibregl.LngLat | null,

  entryDelayMs = 0,
  staggerCap: number = 0, // Set to > 0 to enable stagger (e.g., 20 for nearby search)
): Array<{ PlaceId: string; Marker: maplibregl.Marker }> => {

  if (!Array.isArray(places) || !map) return [];

  const newMarkers: Array<{ PlaceId: string; Marker: maplibregl.Marker }> = [];

  const placesOrdered = orderPlacesByDistance(places, mapCenter || null);
  placesOrdered.forEach((place, i) => {

    // Make Marker Icon with Staggered Fly-In Animation (CSS)
    const staggerMs = entryDelayMs + Math.min(i, staggerCap) * STAGGER_STEP_MS;
    const startOffset = startOffsets?.get(place.id);
    const icon = placeMarkerIcon(staggerMs, startOffset);

    // Create Marker and Add to Layer
    const marker = new maplibregl.Marker({ element: icon, anchor: 'center' })
      .setLngLat([place.lon, place.lat])
      .addTo(map);
    // Attach Click Handler to Marker
    if (onPlaceClick) marker.getElement().addEventListener('click', (event) => {
      event.stopPropagation();
      onPlaceClick(place.id);
    });

    newMarkers.push({ PlaceId: place.id, Marker: marker });
  });

  return newMarkers;
};

export default addPlaceMarkers;


const orderPlacesByDistance = (places: TilePlacePreview[], point: maplibregl.LngLat | null): TilePlacePreview[] => {

  if (!point) return places;

  // Sort by distance to map center if available, so that nearby places fly in first?
  const placesOrdered = [...places];
  if (point) {
    placesOrdered.sort((a, b) => {
      const aDist = point.distanceTo(new maplibregl.LngLat(a.lon, a.lat));
      const bDist = point.distanceTo(new maplibregl.LngLat(b.lon, b.lat));
      return aDist - bDist;
    });
  }

  return placesOrdered;
}