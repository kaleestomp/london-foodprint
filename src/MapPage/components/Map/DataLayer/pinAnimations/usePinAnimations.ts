import L from 'leaflet';

import './densityPin.css';
import useDensityPinLayer from './useDensityPinLayer';
import usePlacePinLayer from './usePlacePinLayer';

/**
 * Thin orchestrator composing density-pin and place-pin animation layers.
 * See useDensityPinLayer and usePlacePinLayer for implementation details.
 */
const usePinAnimations = (
  mapRef:   React.RefObject<L.Map | null>,
  layerRef: React.RefObject<L.LayerGroup | null>,
  options: { onPlaceClick?: (placeId: string) => void } = {},
) => {
  const density = useDensityPinLayer(mapRef, layerRef);
  const places  = usePlacePinLayer(mapRef, layerRef, density, options.onPlaceClick);

  /** Instant wipe — removes all pins from both layers. */
  const clearAll = (): void => {
    density.cancelTimer();
    places.cancelTimer();
    layerRef.current?.clearLayers();
    density.resetState();
    places.resetState();
  };

  return {
    currentResRef:        density.currentResRef,
    addPins:              density.addPins,
    transitionRes:        density.transitionRes,
    transitionToPlaces:   places.transitionToPlaces,
    transitionFromPlaces: places.transitionFromPlaces,
    clearAll,
  };
};

export default usePinAnimations;
