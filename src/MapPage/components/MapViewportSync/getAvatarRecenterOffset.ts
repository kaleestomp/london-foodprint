import type * as maplibregl from 'maplibre-gl';

const AVATAR_SAFE_GAP_PX = 24;

const getAvatarRecenterOffset = (
  map: maplibregl.Map | null,
  panelHeight: number,
): number => {
  if (!map || panelHeight <= 0) return 0;

  const avatarMarker = map.getContainer()
    .querySelector<HTMLElement>('.bubble-avatar-maplibre-marker');
  if (!avatarMarker) return 0;

  const avatarRect = avatarMarker.getBoundingClientRect();
  const drawerTop = window.innerHeight - panelHeight;
  const allowedBottom = drawerTop - AVATAR_SAFE_GAP_PX;
  const blocked = avatarRect.bottom > allowedBottom;
  if (blocked) {
    // const yComposition = 1 - (panelHeight/window.innerHeight);
    const delta = (avatarRect.bottom - allowedBottom) + drawerTop * 0.5;
    return delta;
  } else {
    return 0;
  }
};

export default getAvatarRecenterOffset;
