import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { type LocationResult } from '../../GeoSearchbar/fetchHooks/useGeoSearch';

const PIN_COLOR = '#e63946';
const PIN_SIZE = 32;

const pinIcon = L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="${PIN_SIZE}" height="${PIN_SIZE}" viewBox="0 0 24 24" fill="${PIN_COLOR}" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35))">
    <path d="M12 2c-4.2 0-8 3.22-8 8.2 0 3.32 2.67 7.25 8 11.8 5.33-4.55 8-8.48 8-11.8C20 5.22 16.2 2 12 2m0 10c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2"/>
  </svg>`,
  iconSize: [PIN_SIZE, PIN_SIZE],
  iconAnchor: [PIN_SIZE / 2, PIN_SIZE],
  popupAnchor: [0, -PIN_SIZE],
});

const PICK_UP_DELAY_MS = 200;

const useGeoSearchHandler = (
  mapRef: React.RefObject<L.Map | null>,
  selectedResult: LocationResult | null,
  onPickUp?: (x: number, y: number) => void,
) => {
  const pinRef = useRef<L.Marker | null>(null);
  // Keep latest onPickUp in a ref so the effect doesn't re-run when it changes
  const onPickUpRef = useRef(onPickUp);
  useEffect(() => { onPickUpRef.current = onPickUp; }, [onPickUp]);

  useEffect(() => {
    if (!selectedResult) { return; }
    const map = mapRef.current;
    if (!map) { return; }

    const lat = parseFloat(selectedResult.lat);
    const lon = parseFloat(selectedResult.lon);

    if (pinRef.current) { pinRef.current.remove(); }

    pinRef.current = L.marker([lat, lon], { icon: pinIcon })
      .addTo(map)
      .bindPopup(selectedResult.display_name)
      .openPopup();

    // Attach long-press listener so the placed pin can be picked back up
    const el = pinRef.current.getElement();
    let holdTimer: ReturnType<typeof setTimeout> | null = null;
    if (el) {
      el.style.cursor = 'grab';

      const onPointerDown = (e: PointerEvent) => {
        e.stopPropagation();
        holdTimer = setTimeout(() => {
          holdTimer = null;
          pinRef.current?.remove();
          pinRef.current = null;
          onPickUpRef.current?.(e.clientX, e.clientY);
        }, PICK_UP_DELAY_MS);
      };
      const cancelHold = () => {
        if (holdTimer !== null) { clearTimeout(holdTimer); holdTimer = null; }
      };

      el.addEventListener('pointerdown', onPointerDown);
      el.addEventListener('pointerup', cancelHold);
      el.addEventListener('pointerleave', cancelHold);
    }

    map.flyTo([lat, lon], 12, { duration: 1.2 });

    return () => {
      if (holdTimer !== null) { clearTimeout(holdTimer); }
    };
  }, [selectedResult, mapRef]);
};

export default useGeoSearchHandler;
