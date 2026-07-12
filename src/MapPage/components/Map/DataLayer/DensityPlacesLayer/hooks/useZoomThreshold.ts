import { useEffect, useRef } from 'react';
import L from 'leaflet';

const ZOOM_THRESHOLD = 12;
const MARKER_EXIT_DURATION_MS = 250;

type UseZoomThresholdArgs = {
  enabled: boolean;
  mapRef: React.RefObject<L.Map | null>;
  layerRef: React.RefObject<L.LayerGroup | null>;
  onThresholdCross: () => void; // Called when crossing from below to above threshold
};

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
const useZoomThreshold = ({
  enabled,
  mapRef,
  layerRef,
  onThresholdCross,
}: UseZoomThresholdArgs): void => {
  const suppressedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !mapRef.current) return;

    const handleZoom = () => {
      const currentZoom = mapRef.current!.getZoom();
      const isBelowThreshold = currentZoom < ZOOM_THRESHOLD;

      if (isBelowThreshold && !suppressedRef.current) {
        // Crossing below threshold: fade out markers
        suppressedRef.current = true;
        const layer = layerRef.current;
        if (layer) {
          const markersToRemove: L.Marker[] = [];

          layer.eachLayer((markerLayer) => {
            if (markerLayer instanceof L.Marker) {
              const pin = markerLayer.getElement()?.querySelector<HTMLElement>(
                '.density-pin, .place-pin'
              );
              if (pin) {
                // Remove any existing animation classes
                pin.classList.remove(
                  'density-pin-enter',
                  'density-pin-fly-in',
                  'density-pin-burst',
                  'density-pin-fly-out',
                  'top-place-pin-enter'
                );
                // Apply exit fade animation
                pin.classList.add('density-pin-exit');
                markersToRemove.push(markerLayer);
              }
            }
          });

          // Remove markers after animation completes
          setTimeout(() => {
            markersToRemove.forEach((marker) => {
              if (layer.hasLayer(marker)) {
                layer.removeLayer(marker);
              }
            });
          }, MARKER_EXIT_DURATION_MS);
        }
      } else if (!isBelowThreshold && suppressedRef.current) {
        // Crossing back above threshold: trigger re-render
        suppressedRef.current = false;
        onThresholdCross();
      }
    };

    const map = mapRef.current;
    map.on('zoomend', handleZoom);
    return () => map.off('zoomend', handleZoom);
  }, [enabled, mapRef, layerRef, onThresholdCross]);
};

export default useZoomThreshold;
export { ZOOM_THRESHOLD };
