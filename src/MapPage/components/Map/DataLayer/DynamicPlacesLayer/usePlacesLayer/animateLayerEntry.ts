import L from 'leaflet';

import { type TilePlacePreview } from '../../../../../request/useRequestTiles/request';
import addPlaceMarkers from './placeMarkers/addPlaceMarkers';
import getFlyInOffsetOnEntry from './markerTransitions/getFlyInOffsetOnEntry';
import { type DensityLayer } from '../useDensityLayer/useDensityLayer';

const animateLayerEntry = (
  map: L.Map | null,
  layer: L.LayerGroup | null,
  places: TilePlacePreview[],
  density: DensityLayer,
  markerIdRef: React.RefObject<Map<string, L.Marker>>,
  cancelScheduledRemoval: () => void,
  onPlaceClick?: (placeId: string) => void,
): void => {

  if (!map || !layer) return;

  // 1.CANCEL PENDING REMOVALS - Tile + Places
  density.cancelScheduledLayerRemoval();
  cancelScheduledRemoval();

  // 2.EXTRACT + RESET TILE LAYER STATE
  const resolution = density.currentResRef.current;
  const outgoingTileMarker = new Map(density.densityMarkerRef.current);
  density.resetLayerState();

  // 3. ANIMATION: 
  // Burst density markers into child place markers + fly out in from host marker.
  // Update Outgoing Markers CSS State
  outgoingTileMarker.forEach((marker) => {
    const pin = marker.getElement()?.querySelector<HTMLElement>('.density-pin');
    if (!pin) return;
    pin.classList.remove('density-pin-enter', 'density-pin-fly-in');
    pin.classList.add('density-pin-burst');
  });

  // 4.GET X/Y OFFSETS: each place marker to begin fly-in
  const startOffsets = resolution !== null
    ? getFlyInOffsetOnEntry(map, places, resolution, outgoingTileMarker)
    : undefined;

  // 5.REMOVE DENSITY MARKERS FROM MAP IMMEDIATELY
  setTimeout(() => outgoingTileMarker.forEach((m) => layer.removeLayer(m)), 0);

  // 6.CREATE NEW MARKERS + UPDATE REF MAP
  const newMarkers = addPlaceMarkers(layer, places, onPlaceClick, startOffsets);
  newMarkers.forEach(({ id, marker }) => markerIdRef.current.set(id, marker));

};

export default animateLayerEntry;

