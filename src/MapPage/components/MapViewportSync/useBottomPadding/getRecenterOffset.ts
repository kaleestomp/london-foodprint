const PANEL_MARKER_SAFE_GAP_PX = 24;
import type maplibregl from 'maplibre-gl';

const getRecenterOffset = (
  map: maplibregl.Map | null,
  selectedPlaceId: string | null,
  panelHeight: number,
): number => {
  if (!map || !selectedPlaceId) return 0;

  // CHECK ifMarkerWouldbeBlocked
  // const selectedMarkerShell = map.getContainer().querySelector<HTMLElement>('.top-place-pin-shell.is-selected');
  const selectedMarkerShell = map.getContainer()
    .querySelector<HTMLElement>(`.top-place-pin-shell[data-place-id="${CSS.escape(selectedPlaceId)}"]`);
  if (!selectedMarkerShell) return 0;

  const markerRect = selectedMarkerShell.getBoundingClientRect();
  console.log(markerRect);
  const markerYPosition = window.innerHeight - markerRect.y;
  const yPositionThreshold = panelHeight + PANEL_MARKER_SAFE_GAP_PX;
  const isMarkerWouldbeBlocked = markerYPosition < yPositionThreshold;

  if (isMarkerWouldbeBlocked) {
    const newViewCenterY  = (window.innerHeight - panelHeight) * 0.5 + panelHeight;
    
    const yOffset = newViewCenterY - markerYPosition;

    return yOffset;
  }

  return 0;
};

export default getRecenterOffset;