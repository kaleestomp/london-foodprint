import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import L from 'leaflet';

import { type LatLng, type Point } from '../config';

type ProgrammaticDrop = { lat: number; lng: number; token: number } | null | undefined;

type UseProgrammaticDropFlightArgs = {
  mapRef: RefObject<L.Map | null>;
  programmaticDrop: ProgrammaticDrop;
  handleDrop: (lat: number, lng: number) => void;
  resetFloatingState: () => void;
};

const useProgrammaticDropFlight = ({
  mapRef,
  programmaticDrop,
  handleDrop,
  resetFloatingState,
}: UseProgrammaticDropFlightArgs) => {
  const [flyOutTo, setFlyOutTo] = useState<Point | null>(null);
  const [pendingProgrammaticDrop, setPendingProgrammaticDrop] = useState<LatLng | null>(null);
  const handledProgrammaticTokenRef = useRef<number | null>(null);

  const clearProgrammaticDropFlight = useCallback(() => {
    setFlyOutTo(null);
    setPendingProgrammaticDrop(null);
  }, []);

  const handleFlyOutComplete = useCallback(() => {
    if (!pendingProgrammaticDrop) return;
    handleDrop(pendingProgrammaticDrop.lat, pendingProgrammaticDrop.lng);
  }, [handleDrop, pendingProgrammaticDrop]);

  useEffect(() => {
    if (!programmaticDrop || handledProgrammaticTokenRef.current === programmaticDrop.token) {
      return;
    }

    handledProgrammaticTokenRef.current = programmaticDrop.token;

    const map = mapRef.current;
    if (!map) {
      handleDrop(programmaticDrop.lat, programmaticDrop.lng);
      return;
    }

    const targetLatLng = L.latLng(programmaticDrop.lat, programmaticDrop.lng);
    let cancelled = false;

    const startFlyOut = () => {
      if (cancelled) return;

      const rect = map.getContainer().getBoundingClientRect();
      const point = map.latLngToContainerPoint(targetLatLng);

      resetFloatingState();
      setPendingProgrammaticDrop({ lat: targetLatLng.lat, lng: targetLatLng.lng });
      setFlyOutTo({
        x: rect.left + point.x,
        y: rect.top + point.y,
      });
    };

    if (map.getCenter().distanceTo(targetLatLng) < 1) {
      startFlyOut();
      return () => { cancelled = true; };
    }

    const onMoveEnd = () => {
      map.off('moveend', onMoveEnd);
      startFlyOut();
    };

    map.on('moveend', onMoveEnd);
    map.panTo(targetLatLng, { animate: true });

    return () => {
      cancelled = true;
      map.off('moveend', onMoveEnd);
    };
  }, [handleDrop, mapRef, programmaticDrop, resetFloatingState]);

  return {
    flyOutTo,
    clearProgrammaticDropFlight,
    handleFlyOutComplete,
  };
};

export default useProgrammaticDropFlight;