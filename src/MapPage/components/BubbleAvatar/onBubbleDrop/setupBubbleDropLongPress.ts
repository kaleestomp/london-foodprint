import L from 'leaflet';

import { LONGPRESS_MS } from '../config';

type SetupArgs = {
  markerEl: HTMLElement;
  map: L.Map;
  onPickup: (x: number, y: number) => void;
};

const setupBubbleDropLongPress = ({ markerEl, map, onPickup }: SetupArgs) => {
  let pressTimer: ReturnType<typeof setTimeout> | null = null;
  let startX = 0;
  let startY = 0;

  const cancelPress = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  };

  const releasePress = () => {
    cancelPress();
    map.dragging.enable();
  };

  const onPointerDown = (e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    markerEl.setPointerCapture(e.pointerId);
    map.dragging.disable();
    startX = e.clientX;
    startY = e.clientY;
    pressTimer = setTimeout(() => {
      pressTimer = null;
      map.dragging.enable();
      onPickup(e.clientX, e.clientY);
    }, LONGPRESS_MS);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (Math.abs(e.clientX - startX) > 10 || Math.abs(e.clientY - startY) > 10) {
      cancelPress();
    }
  };

  markerEl.addEventListener('pointerdown', onPointerDown);
  markerEl.addEventListener('pointermove', onPointerMove);
  markerEl.addEventListener('pointerup', releasePress);
  markerEl.addEventListener('pointercancel', releasePress);

  return () => {
    cancelPress();
    markerEl.removeEventListener('pointerdown', onPointerDown);
    markerEl.removeEventListener('pointermove', onPointerMove);
    markerEl.removeEventListener('pointerup', releasePress);
    markerEl.removeEventListener('pointercancel', releasePress);
  };
};

export default setupBubbleDropLongPress;
