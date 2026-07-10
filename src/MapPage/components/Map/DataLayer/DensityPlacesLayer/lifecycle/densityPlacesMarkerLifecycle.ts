import L from 'leaflet';

type MarkerRemovalTimer = ReturnType<typeof setTimeout>;

type DeferredLayerRemovalTimerRef = {
  current: MarkerRemovalTimer | null;
};

type DeferredLayerPendingRef = {
  current: L.Marker[];
};

type CancelDeferredLayerRemovalOptions = {
  layer: L.LayerGroup | null;
  timerRef: DeferredLayerRemovalTimerRef;
  pendingRef: DeferredLayerPendingRef;
};

type ScheduleDeferredLayerRemovalOptions = {
  layer: L.LayerGroup;
  markers: L.Marker[];
  delayMs: number;
  timerRef: DeferredLayerRemovalTimerRef;
  pendingRef: DeferredLayerPendingRef;
};

export const cancelDeferredLayerRemoval = ({
  layer,
  timerRef,
  pendingRef,
}: CancelDeferredLayerRemovalOptions): void => {
  if (!timerRef.current) return;

  clearTimeout(timerRef.current);
  timerRef.current = null;

  if (layer) {
    pendingRef.current.forEach((marker) => layer.removeLayer(marker));
  }
  pendingRef.current = [];
};

export const scheduleDeferredLayerRemoval = ({
  layer,
  markers,
  delayMs,
  timerRef,
  pendingRef,
}: ScheduleDeferredLayerRemovalOptions): void => {
  pendingRef.current = markers;
  timerRef.current = setTimeout(() => {
    markers.forEach((marker) => layer.removeLayer(marker));
    pendingRef.current = [];
    timerRef.current = null;
  }, delayMs);
};
