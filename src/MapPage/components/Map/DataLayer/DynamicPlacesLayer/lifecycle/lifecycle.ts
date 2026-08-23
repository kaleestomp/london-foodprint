import type maplibregl from 'maplibre-gl';
import type { PersistentLayer } from '../../LayerStates/createPersistentLayer';

type MarkerRemovalTimer = ReturnType<typeof setTimeout>;
export type RemovalTimerRef = { current: MarkerRemovalTimer | null };
export type RemovalPendingRef = { current: maplibregl.Marker[] };

export const cancelLayerRemoval = (
  layer: PersistentLayer | null,
  timerRef: RemovalTimerRef,
  pendingRef: RemovalPendingRef,
): void => {
  if (!timerRef.current) return;

  clearTimeout(timerRef.current);
  timerRef.current = null;

  if (layer) {
    pendingRef.current.forEach((marker) => {
      marker.remove();
      layer.markers.delete(marker);
    });
  }
  pendingRef.current = [];
};

export const scheduleLayerRemoval = (
  layer: PersistentLayer,
  markers: maplibregl.Marker[],
  delayMs: number,
  timerRef: RemovalTimerRef,
  pendingRef: RemovalPendingRef,
): void => {

  pendingRef.current = markers;
  timerRef.current = setTimeout(() => {
    markers.forEach((marker) => {
      marker.remove();
      layer.markers.delete(marker);
    });
    pendingRef.current = [];
    timerRef.current = null;
  }, delayMs);
  // delayMs is really about DOM cleanup (memory/performance), not visual animation timing.
  // Testing different values won't show visible changes because the animation styling already finished by then.
};
