import L from 'leaflet';

import type { TopPlaceItem } from '../../../../request/useRequestTopPlaces/request';
import makeTopPlacePinIcon from './makeTopPlacePinIcon';

const resolveHighlightCount = (count: number): number => {
  if (count <= 0) return 0;
  if (count >= 10) return Math.min(3, count);
  return Math.min(count, Math.max(1, Math.ceil(count * 0.3)));
};

const addTopPlaceMarkers = (
  layer: L.LayerGroup,
  data: TopPlaceItem[],
  onPlaceClick?: (placeId: string) => void,
): Array<{ id: string; marker: L.Marker }> => {
  if (!Array.isArray(data) || !layer) return [];

  const highlightCount = resolveHighlightCount(data.length);
  const created: Array<{ id: string; marker: L.Marker }> = [];

  data.forEach((place, idx) => {
    const highlighted = idx < highlightCount;
    const marker = L.marker([place.lat, place.lon], {
      icon: makeTopPlacePinIcon({ highlighted }),
      zIndexOffset: highlighted ? 1600 : 1400,
    }).addTo(layer);

    if (onPlaceClick) {
      marker.on('click', () => onPlaceClick(place.id));
    }

    created.push({ id: place.id, marker });
  });

  return created;
};

export default addTopPlaceMarkers;
