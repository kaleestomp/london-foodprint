import L from 'leaflet';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import bakeryIconSrc from '../../../../../../assets/icon_cuisines/bakery.png';

const TEST_ICON_SRC = bakeryIconSrc;
const ICON_SIZE = 24; // All pins same size 22
const ENTER_CLASS = 'enter-animation';
const EXIT_CLASS = 'exit-animation';

const makeTopPlacePinIcon = (): L.DivIcon => {

  return L.divIcon({
    className: '',
    iconSize: [ICON_SIZE, ICON_SIZE],
    iconAnchor: [ICON_SIZE / 2, ICON_SIZE / 2],
    popupAnchor: [0, -ICON_SIZE-3],
    html: `<div class="top-place-pin-shell ${ENTER_CLASS}">
      <div class="top-place-pin-hover">
        <div class="top-place-pin-motion">
          ${renderToStaticMarkup(createElement('img', {
              src: TEST_ICON_SRC, alt: '', 
              className: 'top-place-pin-image', 
              style: { width: `${ICON_SIZE}px`, height: `${ICON_SIZE}px` },
              draggable: false,
          }))}
        </div>
      </div>
    </div>`,
  });
};

// <svg class="top-place-pin-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
//   <path d="M12 22 L2 12 L6.5 7 L17.5 7 L22 12 Z" />
// </svg>

// ANIMATION HELPERS
const withShell = (marker: L.Marker, fn: (shell: HTMLElement) => void): void => {
  const shell = marker.getElement()?.querySelector<HTMLElement>('.top-place-pin-shell');
  if (!shell) return;
  fn(shell);
};

export const animateTopPlacePinExit = (marker: L.Marker): void => {
  withShell(marker, (shell) => {
    shell.classList.remove(ENTER_CLASS);
    void shell.offsetWidth;
    shell.classList.add(EXIT_CLASS);
  });
};

export const clearTopPlacePinTransitions = (marker: L.Marker): void => {
  withShell(marker, (shell) => {
    shell.classList.remove(ENTER_CLASS, EXIT_CLASS);
  });
};

export const restartTopPlacePinEnter = (marker: L.Marker): void => {
  withShell(marker, (shell) => {
    shell.classList.remove(EXIT_CLASS);
    shell.classList.remove(ENTER_CLASS);
    void shell.offsetWidth;
    shell.classList.add(ENTER_CLASS);
  });
};

export default makeTopPlacePinIcon;
