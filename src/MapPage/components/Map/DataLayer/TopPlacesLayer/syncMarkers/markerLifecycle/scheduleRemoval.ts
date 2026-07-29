import L from 'leaflet';
import type { MarkerLifecycleEntry } from './markerLifecycle';

type Props = {
  layer: L.LayerGroup;
  entry: MarkerLifecycleEntry;
  delayMs: number;
  onExit: (marker: L.Marker) => void;
};
export const scheduleExitRemoval = ({ layer, entry, delayMs, onExit }: Props): void => {
  if (entry.removalTimer) return;

  onExit(entry.marker);
  entry.removalTimer = setTimeout(() => {
    if (layer.hasLayer(entry.marker)) {
      layer.removeLayer(entry.marker);
    }
    entry.removalTimer = null;
  }, delayMs);
};


export const cancelScheduledRemoval = (entry: MarkerLifecycleEntry): void => {
  if (entry.removalTimer) {
    clearTimeout(entry.removalTimer);
    entry.removalTimer = null;
  }
};

