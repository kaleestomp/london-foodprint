import L from 'leaflet';

type MarkerRemovalTimer = ReturnType<typeof setTimeout>;
export type RemovalTimerRef = { current: MarkerRemovalTimer | null };
export type RemovalPendingRef = { current: L.Marker[] };

export const cancelLayerRemoval = (
  layer: L.LayerGroup | null,
  timerRef: RemovalTimerRef,
  pendingRef: RemovalPendingRef,
): void => {
  if (!timerRef.current) return;

  clearTimeout(timerRef.current);
  timerRef.current = null;

  if (layer) {
    pendingRef.current.forEach((marker) => layer.removeLayer(marker));
  }
  pendingRef.current = [];
};

export const scheduleLayerRemoval = (
  layer: L.LayerGroup,
  markers: L.Marker[],
  delayMs: number,
  timerRef: RemovalTimerRef,
  pendingRef: RemovalPendingRef,
): void => {

  pendingRef.current = markers;
  timerRef.current = setTimeout(() => {
    markers.forEach((marker) => layer.removeLayer(marker));
    pendingRef.current = [];
    timerRef.current = null;
  }, delayMs);
  // delayMs is really about DOM cleanup (memory/performance), not visual animation timing.
  // Testing different values won't show visible changes because the animation styling already finished by then.
};
