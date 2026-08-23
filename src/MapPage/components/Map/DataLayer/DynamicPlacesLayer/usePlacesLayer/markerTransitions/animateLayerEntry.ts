import type maplibregl from 'maplibre-gl';

import { type TilePlacePreview } from '../../../../../../request/useRequestTiles/request';
import { type TileMarkerRegistry } from '../../useDensityLayer/useDensityLayer';
import addPlaceMarkers from '../placeMarkers/addPlaceMarkers';
import getFlyInOffsetOnEntry from '../markerTransitions/getFlyInOffsetOnEntry';

type Props = {
  map: maplibregl.Map | null,
  places: TilePlacePreview[],
  markerRef: React.RefObject<Map<string, maplibregl.Marker>>,
  outgoingTileMarker: TileMarkerRegistry,
  outgoingRes: number | null,
  onPlaceClick?: (placeId: string) => void,
  onMarkersAdded?: (markers: maplibregl.Marker[]) => void,
}
const animateLayerEntry = ({
  map, places, markerRef,
  outgoingTileMarker, outgoingRes,
  onPlaceClick, onMarkersAdded,
}: Props): void => {
  if (!map) return;

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
  const newMarkers = addPlaceMarkers(map, incomingPlaces, onPlaceClick, startOffsets);
  newMarkers.forEach(({ PlaceId, Marker }) => markerRef.current.set(PlaceId, Marker));
  onMarkersAdded?.(newMarkers.map(({ Marker }) => Marker));

};

export default animateLayerEntry;

