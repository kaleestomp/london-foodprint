import type maplibregl from 'maplibre-gl';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import getCuisineIconSrc from './getCuisineIconSrc';

const ICON_SIZE = 26; // All pins same size 22
const ENTER_CLASS = 'enter-animation';
const EXIT_CLASS = 'exit-animation';

const TopPlacePin = (cuisineType?: string): HTMLDivElement => {

  const iconSrc = getCuisineIconSrc(cuisineType);
  const element = document.createElement('div');

  element.innerHTML = `<div class="top-place-pin-shell ${ENTER_CLASS}">
      <div class="top-place-pin-hover">
        <div class="top-place-pin-motion">
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
  return element;
};

// <svg class="top-place-pin-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
//   <path d="M12 22 L2 12 L6.5 7 L17.5 7 L22 12 Z" />
// </svg>

// ANIMATION HELPERS
const withShell = (marker: maplibregl.Marker, fn: (shell: HTMLElement) => void): void => {
  const shell = marker.getElement()?.querySelector<HTMLElement>('.top-place-pin-shell');
  if (!shell) return;
  fn(shell);
};

export const animateTopPlacePinExit = (marker: maplibregl.Marker): void => {
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
