import L from 'leaflet';
import { cellToBoundary, cellToLatLng } from 'h3-js';
import { type TileDensity } from '../../../../request/useRequestTiles/request';

const OVERLAY_PANE_NAME = 'debug-tile-overlay';

const ensureOverlayPane = (map: L.Map): string => {
  const existingPane = map.getPane(OVERLAY_PANE_NAME);
  if (existingPane) return OVERLAY_PANE_NAME;

  const pane = map.createPane(OVERLAY_PANE_NAME);
  pane.style.zIndex = '580';
  pane.style.pointerEvents = 'auto';
  return OVERLAY_PANE_NAME;
};

const addDebugTileOverlay = (
  map: L.Map,
  layer: L.LayerGroup,
  tiles: TileDensity[],
): void => {
  const pane = ensureOverlayPane(map);

  tiles.forEach((tileData) => {
    const tileId = tileData.tile;
    const count = tileData.count;

    const boundary = cellToBoundary(tileId).map((point) => [point[0], point[1]] as [number, number]);

    const polygon = L.polygon(boundary, {
      pane,
      color: '#0b8c8f',
      weight: 1,
      fillColor: '#0b8c8f',
      fillOpacity: 0.08,
    });

    polygon.bindPopup(`tile: ${tileId}<br/>count: ${count}`);
    polygon.bindTooltip(`tile: ${tileId}`, {
      direction: 'top',
      sticky: true,
      opacity: 0.95,
    });
    polygon.on('click', () => {
      polygon.openPopup();
    });

    const [lat, lng] = cellToLatLng(tileId);
    const countMarker = L.marker([lat, lng], {
      pane,
      icon: L.divIcon({
        className: 'debug-tile-density-label',
        html: `<div style="background:#ffffffd9;border:1px solid #0b8c8f;border-radius:12px;padding:2px 6px;font:600 12px/1.1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;color:#0b3133;">${count}</div>`,
        iconSize: [24, 18],
        iconAnchor: [12, 9],
      }),
      interactive: false,
    });

    polygon.addTo(layer);
    countMarker.addTo(layer);
  });
};

export default addDebugTileOverlay;
