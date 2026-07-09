import { useRef, useState, useEffect, useCallback } from 'react';
import L from 'leaflet';
import { type LocationResult } from '../../GeoSearchbar/fetchHooks/useGeoSearch';
import useGeoSearchHandler from '../../Map/GeoSearchHandler/GeoSearchHandler';
import useReverseGeocode from '../../GeoSearchbar/fetchHooks/useReverseGeocode';

const usePinCarry = (mapRef: React.RefObject<L.Map | null>) => {
  const [carrying, setCarrying] = useState(false);
  const [hoveringButton, setHoveringButton] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [location, setLocation] = useState<LocationResult | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { lookup } = useReverseGeocode();

  // Stable callback — passed to GeoSearchHandler so the placed marker can
  // trigger carry mode when the user long-presses it.
  const startCarry = useCallback((x: number, y: number) => {
    setCarrying(true);
    setHoveringButton(false);
    setCursorPos({ x, y });
  }, []);

  useGeoSearchHandler(mapRef, location, startCarry);

  const handleDrop = useCallback(async (lat: number, lon: number) => {
    const result = await lookup(lat, lon);
    setLocation(result);
  }, [lookup]);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setCarrying(true);
    setHoveringButton(true);
    setCursorPos({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (!carrying) { return; }

    document.body.classList.add('drop-pin-carrying');
    mapRef.current?.dragging.disable();

    const onMove = (e: PointerEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
      const btn = buttonRef.current;
      if (btn) {
        const r = btn.getBoundingClientRect();
        setHoveringButton(
          e.clientX >= r.left && e.clientX <= r.right &&
          e.clientY >= r.top  && e.clientY <= r.bottom
        );
      }
    };

    const onUp = (e: PointerEvent) => {
      document.body.classList.remove('drop-pin-carrying');
      mapRef.current?.dragging.enable();
      setCarrying(false);
      setHoveringButton(false);

      // Released back on the FAB button → cancel, no location update
      const btn = buttonRef.current;
      if (btn) {
        const r = btn.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
          return;
        }
      }

      // Released over the map → convert to lat/lon then reverse geocode
      const map = mapRef.current;
      if (!map) { return; }
      const mapRect = map.getContainer().getBoundingClientRect();
      if (
        e.clientX >= mapRect.left && e.clientX <= mapRect.right &&
        e.clientY >= mapRect.top  && e.clientY <= mapRect.bottom
      ) {
        const point = L.point(e.clientX - mapRect.left, e.clientY - mapRect.top);
        const latLng = map.containerPointToLatLng(point);
        handleDrop(latLng.lat, latLng.lng);
      }
      // Released outside map → cancel silently
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);

    return () => {
      document.body.classList.remove('drop-pin-carrying');
      mapRef.current?.dragging.enable();
      setHoveringButton(false);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
  }, [carrying, mapRef, handleDrop]);

  return { carrying, hoveringButton, cursorPos, buttonRef, handlePointerDown };
};

export default usePinCarry;
