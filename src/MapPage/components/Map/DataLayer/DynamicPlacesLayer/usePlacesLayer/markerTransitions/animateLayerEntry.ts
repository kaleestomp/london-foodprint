import L from 'leaflet';

import { type TilePlacePreview } from '../../../../../../request/useRequestTiles/request';
import { type TileMarkerRegistry } from '../../useDensityLayer/useDensityLayer';
import addPlaceMarkers from '../placeMarkers/addPlaceMarkers';
import getFlyInOffsetOnEntry from '../markerTransitions/getFlyInOffsetOnEntry';

type Props = {
  map: L.Map | null,
  layer: L.LayerGroup | null,
  places: TilePlacePreview[],
  markerRef: React.RefObject<Map<string, L.Marker>>,
  outgoingTileMarker: TileMarkerRegistry,
  outgoingRes: number | null,
  onPlaceClick?: (placeId: string) => void,
}
const animateLayerEntry = ({
  map, layer, places, markerRef,
  outgoingTileMarker, outgoingRes,
  onPlaceClick,
}: Props): void => {
  if (!map || !layer) return;

  // Burst density markers into child place markers + fly out in from host marker.
  // Update Outgoing Markers CSS State
  outgoingTileMarker.forEach(({ Marker }) => {
    const pin = Marker.getElement()?.querySelector<HTMLElement>('.density-pin');
    if (!pin) return;
    pin.classList.remove('density-pin-enter', 'density-pin-fly-in');
    pin.classList.add('density-pin-burst');
  });

  // PARSE INCOMING PLACES
  const incomingPlaces = places.filter((p) => !markerRef.current.has(p.id));

  // GET X/Y OFFSETS: each place marker to begin fly-in
  const startOffsets = outgoingRes !== null
    ? getFlyInOffsetOnEntry(map, incomingPlaces, outgoingRes, outgoingTileMarker)
    : undefined;

  // CREATE NEW MARKERS + UPDATE REF MAP
  const newMarkers = addPlaceMarkers(layer, incomingPlaces, onPlaceClick, startOffsets);
  newMarkers.forEach(({ PlaceId, Marker }) => markerRef.current.set(PlaceId, Marker));

};

export default animateLayerEntry;

