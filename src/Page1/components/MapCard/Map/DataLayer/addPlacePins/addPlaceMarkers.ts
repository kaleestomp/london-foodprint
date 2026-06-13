import L from 'leaflet';
import { type TilePlacePreview } from '../../../../../request/useRequestTiles/request';
import makePlacePinIcon from './makePlacePinIcon';

const STAGGER_STEP_MS = 28;
const STAGGER_CAP = 20;

const addPlaceMarkers = (
  layer: L.Map | L.LayerGroup,
  data: TilePlacePreview[],
  startOffsets?: Map<string, { dx: number; dy: number }>,
  mapCenter?: L.LatLng | null,
  entryDelayMs = 0,
): Array<{ id: string; marker: L.Marker }> => {
  if (!Array.isArray(data) || !layer) return [];

  const ordered = [...data];
  if (mapCenter) {
    ordered.sort((a, b) => {
      const aDist = L.latLng(a.lat, a.lon).distanceTo(mapCenter);
      const bDist = L.latLng(b.lat, b.lon).distanceTo(mapCenter);
      return aDist - bDist;
    });
  }

  const created: Array<{ id: string; marker: L.Marker }> = [];

  ordered.forEach((place, i) => {
    const rankPct = place.rank != null ? `${Math.round(place.rank * 100)}th percentile` : '';
    const rating  = place.rating != null ? `⭐ ${place.rating} (${place.user_rating_count ?? 0})` : '';

    const staggerMs = entryDelayMs + Math.min(i, STAGGER_CAP) * STAGGER_STEP_MS;
    const offset = startOffsets?.get(place.id);
    const icon = makePlacePinIcon({
      staggerMs,
      startOffset: offset,
    });

    const marker = L.marker([place.lat, place.lon], { icon })
      .bindPopup(
        `<strong>${place.display_name}</strong><br/>` +
        `${place.cuisine_type ?? ''}${place.cost ? ' · ' + place.cost : ''}<br/>` +
        `${rating}${rankPct ? '<br/>' + rankPct : ''}`
      )
      .addTo(layer);

    created.push({ id: place.id, marker });
  });

  return created;
};

export default addPlaceMarkers;