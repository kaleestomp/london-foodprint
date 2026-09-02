import type maplibregl from 'maplibre-gl';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import getCuisineIconSrc from './getCuisineIconSrc';
import { getCuisineColor } from './backdropColors/getCuisineColor';

const ICON_SIZE = 26; // All pins same size 22
const ENTER_CLASS = 'enter-animation';
const EXIT_CLASS = 'exit-animation';

const TopPlacePin = (placeId?: string, cuisineType?: string): HTMLDivElement => {

  const iconSrc = getCuisineIconSrc(cuisineType);
  const element = document.createElement('div');

  element.innerHTML = `<div class="top-place-pin-shell ${ENTER_CLASS}">
      <div class="top-place-pin-hover">
        <div class="top-place-pin-motion">
          <div class="top-place-pin-rank-badge" aria-hidden="true">
            <svg class="top-place-pin-rank-badge-backdrop" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" focusable="false">
              <path d="M12 0l2.139 2.629 3.068-1.441.786 3.297 3.389.033-.722 3.312 3.039 1.5-2.088 2.67 2.088 2.67-3.039 1.5.722 3.312-3.389.033-.786 3.297-3.068-1.441-2.139 2.629-2.139-2.629-3.068 1.441-.786-3.297-3.389-.033.722-3.312-3.039-1.5 2.088-2.67-2.088-2.67 3.039-1.5-.722-3.312 3.389-.033.786-3.297 3.068 1.441z" />
            </svg>
            <span class="top-place-pin-rank-badge-label"></span>
          </div>
          ${renderToStaticMarkup(createElement('img', {
            src: iconSrc,
            alt: cuisineType ?? '',
            className: 'top-place-pin-image',
            style: { width: `${ICON_SIZE}px`, height: `${ICON_SIZE}px` },
            draggable: false,
          }))}
        </div>
      </div>
    </div>`;

  // Apply precomputed icon-tinted backdrop, fallback to white.
  const shell = element.querySelector<HTMLElement>('.top-place-pin-shell');
  if (shell) {
    shell.dataset.placeId = placeId;
    shell.style.setProperty('--bubble-color', getCuisineColor(cuisineType));
  }

  return element;
};

// ANIMATION HELPERS
const withShell = (marker: maplibregl.Marker, fn: (shell: HTMLElement) => void): void => {
  const shell = marker.getElement()?.querySelector<HTMLElement>('.top-place-pin-shell');
  if (!shell) return;
  fn(shell);
};

export const clearTopPlacePinSelectedState = (marker: maplibregl.Marker): void => {
  const motion = marker.getElement()?.querySelector<HTMLElement>('.top-place-pin-motion');
  const shell = marker.getElement()?.querySelector<HTMLElement>('.top-place-pin-shell');
  const rankBadge = marker.getElement()?.querySelector<HTMLElement>('.top-place-pin-rank-badge');
  const rankBadgeLabel = marker.getElement()?.querySelector<HTMLElement>('.top-place-pin-rank-badge-label');

  motion?.classList.remove('is-selected');
  shell?.classList.remove('is-selected');
  rankBadge?.classList.remove('has-rank');
  if (rankBadgeLabel) rankBadgeLabel.textContent = '';
};

export const animateTopPlacePinExit = (marker: maplibregl.Marker): void => {
  clearTopPlacePinSelectedState(marker);
  withShell(marker, (shell) => {
    shell.classList.remove(ENTER_CLASS);
    shell.getAnimations().forEach((a) => a.cancel());
    shell.classList.add(EXIT_CLASS);
  });
};

export const clearTopPlacePinTransitions = (marker: maplibregl.Marker): void => {
  withShell(marker, (shell) => {
    shell.classList.remove(ENTER_CLASS, EXIT_CLASS);
  });
};

export const restartTopPlacePinEnter = (marker: maplibregl.Marker): void => {
  withShell(marker, (shell) => {
    shell.classList.remove(EXIT_CLASS);
    shell.classList.remove(ENTER_CLASS);
    shell.getAnimations().forEach((a) => a.cancel());
    shell.classList.add(ENTER_CLASS);
  });
};

export default TopPlacePin;
