import L from 'leaflet';

const DIAMOND_PATH = 'M12 22 L2 12 L6.5 7 L17.5 7 L22 12 Z';

type MakeTopPlacePinIconArgs = {
  highlighted: boolean;
};

const makeTopPlacePinIcon = ({ highlighted }: MakeTopPlacePinIconArgs): L.DivIcon => {
  const size = highlighted ? 26 : 22;
  const iconClass = highlighted ? 'top-place-pin-shell top-place-pin-shell--highlight' : 'top-place-pin-shell';

  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div class="${iconClass}">
      <div class="top-place-pin-hover">
        <div class="top-place-pin-motion">
          <svg class="top-place-pin-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="${DIAMOND_PATH}" />
          </svg>
        </div>
      </div>
    </div>`,
  });
};

export default makeTopPlacePinIcon;
