import L from 'leaflet';

// Preferred beveled diamond silhouette.
const SVG_05 = 'M12 22 L2 12 L6.5 7 L17.5 7 L22 12 Z';
const SVG_10 = 'M12 1.5 L18 5.5 L18 18.5 L12 22.5 L6 18.5 L6 5.5 Z';
const HIGHLIGHT_CLASS = 'top-place-pin-shell--highlight';
const MORPH_CLASS = 'top-place-pin-shell--morph';
const ENTER_CLASS = 'top-place-pin-shell--enter';
const EXIT_CLASS = 'top-place-pin-shell--exit';

type MakeTopPlacePinIconArgs = {
  highlighted: boolean;
};

const makeTopPlacePinIcon = ({ highlighted }: MakeTopPlacePinIconArgs): L.DivIcon => {
  const size = 22; // All pins same size
  const iconClass = highlighted
    ? `top-place-pin-shell ${ENTER_CLASS} ${HIGHLIGHT_CLASS}`
    : `top-place-pin-shell ${ENTER_CLASS}`;

  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -25],
    html: `<div class="${iconClass}">
      <div class="top-place-pin-hover">
        <div class="top-place-pin-motion">
          <svg class="top-place-pin-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="${SVG_10}" />
          </svg>
        </div>
      </div>
    </div>`,
  });
};

const withShell = (marker: L.Marker, fn: (shell: HTMLElement) => void): void => {
  const shell = marker.getElement()?.querySelector<HTMLElement>('.top-place-pin-shell');
  if (!shell) return;
  fn(shell);
};

export const setTopPlaceMarkerHighlighted = (
  marker: L.Marker,
  highlighted: boolean,
  animate = false,
): void => {
  withShell(marker, (shell) => {
    shell.classList.toggle(HIGHLIGHT_CLASS, highlighted);
    if (!animate) return;
    shell.classList.remove(MORPH_CLASS);
    void shell.offsetWidth;
    shell.classList.add(MORPH_CLASS);
  });
};

export const animateTopPlacePinExit = (marker: L.Marker): void => {
  withShell(marker, (shell) => {
    shell.classList.remove(ENTER_CLASS, MORPH_CLASS);
    void shell.offsetWidth;
    shell.classList.add(EXIT_CLASS);
  });
};

export const clearTopPlacePinTransitions = (marker: L.Marker): void => {
  withShell(marker, (shell) => {
    shell.classList.remove(ENTER_CLASS, EXIT_CLASS, MORPH_CLASS);
  });
};

export const restartTopPlacePinEnter = (marker: L.Marker): void => {
  withShell(marker, (shell) => {
    shell.classList.remove(EXIT_CLASS, MORPH_CLASS);
    shell.classList.remove(ENTER_CLASS);
    void shell.offsetWidth;
    shell.classList.add(ENTER_CLASS);
  });
};

export default makeTopPlacePinIcon;
