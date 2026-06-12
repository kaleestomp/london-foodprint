import L from 'leaflet';
import { type TilePlacePreview } from '../../../../../request/useRequestTiles/request';
import makePlacePinIcon from './makePlacePinIcon';

// Reuse a no-offset icon instance when no start offsets are provided.
const PLACE_PIN_ICON = makePlacePinIcon();

const addPlaceMarkers = (
  layer: L.Map | L.LayerGroup,
  data: TilePlacePreview[],
  startOffsets?: Map<string, { dx: number; dy: number }>,
): Array<{ id: string; marker: L.Marker }> => {
  if (!Array.isArray(data) || !layer) return [];

  const created: Array<{ id: string; marker: L.Marker }> = [];

  data.forEach((place) => {
    const rankPct = place.rank != null ? `${Math.round(place.rank * 100)}th percentile` : '';
    const rating  = place.rating != null ? `⭐ ${place.rating} (${place.user_rating_count ?? 0})` : '';

    const offset = startOffsets?.get(place.id);
    const icon   = offset ? makePlacePinIcon(offset) : PLACE_PIN_ICON;

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