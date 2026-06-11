import L from 'leaflet';
import { type TilePlacePreview } from '../../../../request/useRequestTiles/request';

const addMarkers = (layer: L.Map | L.LayerGroup, data: TilePlacePreview[]) => {
  if (!Array.isArray(data) || !layer) return;

  data.forEach((place) => {
    const marker = L.circleMarker([place.lat, place.lon], {
      radius: 7,
      color: '#114b5f',
      weight: 2,
      fillColor: '#1a936f',
      fillOpacity: 0.9,
    }).addTo(layer);

    const rankPct = place.rank != null ? `${Math.round(place.rank * 100)}th percentile` : '';
    const rating = place.rating != null ? `⭐ ${place.rating} (${place.user_rating_count ?? 0})` : '';
    marker.bindPopup(
      `<strong>${place.display_name}</strong><br/>${place.cuisine_type ?? ''}${place.cost ? ' · ' + place.cost : ''}<br/>${rating}${rankPct ? '<br/>' + rankPct : ''}`
    );
  });
};

export default addMarkers;