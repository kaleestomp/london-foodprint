import type { MarkerLifecycleEntry } from './markerLifecycle';

type Props = {
  entry: MarkerLifecycleEntry;
  delayMs: number;
  onExit: (marker: maplibregl.Marker) => void;
};
export const scheduleExitRemoval = ({ entry, delayMs, onExit }: Props): void => {
  if (entry.removalTimer) return;

  onExit(entry.marker);
  entry.removalTimer = setTimeout(() => {
    if (entry.marker.getElement().isConnected) {
      entry.marker.remove();
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

