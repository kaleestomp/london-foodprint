import { useEffect, useRef } from 'react';
import type maplibregl from 'maplibre-gl';

import type { PersistentLayer } from '../../LayerStates/createPersistentLayer';

const ZOOM_THRESHOLD = 12;
const MARKER_EXIT_DURATION_MS = 250;

/**
 * Manages zoom-based marker visibility with smooth fade-out animations.
 * 
 * When zooming below the threshold:
 * - Applies fade-out animation to all markers
 * - Removes them after animation completes
 * 
 * When zooming back above the threshold:
 * - Calls `onThresholdCross()` to trigger re-rendering
 * 
 * Can be disabled/removed by setting `enabled: false`.
 */

const useZoomThreshold = (
  mapRef: React.RefObject<maplibregl.Map | null>,
  layerRef: React.RefObject<PersistentLayer | null>,
  onThresholdCross: () => void, // Called when crossing from below to above threshold
  enabled?: boolean
): void => {
  const suppressedRef = useRef(false);

  useEffect(() => {
    const map = mapRef.current;
    if (!enabled || !map) return;

    const handleZoom = () => {
      const currentZoom = map.getZoom();
      const isBelowThreshold = currentZoom < ZOOM_THRESHOLD;

      if (isBelowThreshold && !suppressedRef.current) {
        // Crossing below threshold: fade out markers
        suppressedRef.current = true;
        const layer = layerRef.current;
        if (layer) {
          const markersToRemove = Array.from(layer.markers);
          markersToRemove.forEach((marker) => {
            const pin = marker.getElement().querySelector<HTMLElement>('.density-pin, .place-pin');
            if (!pin) return;
            pin.classList.remove('density-pin-enter', 'density-pin-fly-in', 'density-pin-burst', 'density-pin-fly-out');
            pin.classList.add('density-pin-exit');
          });

          // Remove markers after animation completes
          setTimeout(() => {
            markersToRemove.forEach((marker) => {
              marker.remove();
              layer.markers.delete(marker);
            });
          }, MARKER_EXIT_DURATION_MS);
        }
      } else if (!isBelowThreshold && suppressedRef.current) {
        // Crossing back above threshold: trigger re-render
        suppressedRef.current = false;
        onThresholdCross();
      }
    };

    map.on('zoomend', handleZoom);

    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [enabled, mapRef, layerRef, onThresholdCross]);
};

export default useZoomThreshold;
export { ZOOM_THRESHOLD };
