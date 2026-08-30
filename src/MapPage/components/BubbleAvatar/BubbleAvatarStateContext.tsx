import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode, Dispatch, SetStateAction } from 'react';
import type maplibregl from 'maplibre-gl';
import { useSearchFilters } from '../../../context/SearchFiltersContext';
import { SEARCH_RADIUS } from './config';

type Point = { x: number; y: number };

interface BubbleAvatarState {
  /** Screen-space coordinate where the bubble landed for UI styling/animation */
  screenXY: Point | null;

  /** Screen coordinate where pickup was triggered — mounts BubbleButton there
   *  instead of its home position and auto-starts the drag. */
  pickupPos: Point | null;

  /** Whether the button is currently being dragged by the user */
  isDragging: boolean;

  /** Start/stop drag without exposing the raw setter */
  beginDragging: () => void;
  endDragging: () => void;

  /** Whether the button is currently near its home position
   *  (used to determine whether to show the ghost) */
  isNearHome: boolean;

  /** Update near-home state without exposing the raw setter */
  setIsNearHome: Dispatch<SetStateAction<boolean>>;

  /** Screen coordinate where the button should fly in from when returning home */
  flyInFrom: Point | null;

  /** Reset all floating state to HOME */
  resetBubbleToHome: (from?: Point) => void;

  /** Handle user drop event: store the map location and the screen-space point */
  handleDropLatLng: (lat: number, lng: number) => void;
  handleDropXY: (map: maplibregl.Map, x: number, y: number) => void;

  /** Set pickup position for manual drag start */
  handlePickup: (x: number, y: number) => void;

  /** Off-map release in pickup mode: clear pickupPos so button jumps to home */
  handleDropCancel: () => void;
}

const BubbleAvatarStateContext = createContext<BubbleAvatarState | undefined>(undefined);

export const useBubbleAvatarState = (): BubbleAvatarState => {
  const context = useContext(BubbleAvatarStateContext);
  if (!context) {
    throw new Error('useBubbleAvatarState must be used within BubbleAvatarStateProvider');
  }
  return context;
};

export const BubbleAvatarStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { setSearchMask } = useSearchFilters();
  const [screenXY, setScreenXY] = useState<Point | null>(null);
  const [pickupPos, setPickupPos] = useState<Point | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isNearHome, setIsNearHome] = useState(false);
  const [flyInFrom, setFlyInFrom] = useState<Point | null>(null);

  const resetBubbleToHome = useCallback((from?: Point) => {
    setScreenXY(null);
    setSearchMask(null);
    setPickupPos(null);
    setFlyInFrom(from ?? null);
    setIsDragging(false);
  }, [setSearchMask]);

  const beginDragging = useCallback(() => {
    setIsDragging(true);
  }, []);

  const endDragging = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDropLatLng = useCallback((lat: number, lng: number) => {

    setSearchMask({ center: { lat, lng }, radiusM: SEARCH_RADIUS });
    setPickupPos(null);
    setFlyInFrom(null);
    setIsDragging(false);

  }, [setSearchMask]);

  const handleDropXY = useCallback((map: maplibregl.Map, x: number, y: number) => {

    const rect = map.getContainer().getBoundingClientRect();
    const insideMap = 
      x >= rect.left && x <= rect.right &&
      y >= rect.top && y <= rect.bottom;
    if (insideMap) {
      const point = { x: x - rect.left, y: y - rect.top };
      const { lat, lng } = map.unproject([point.x, point.y]);
      setSearchMask({ center: { lat, lng }, radiusM: SEARCH_RADIUS });
      setPickupPos(null);
      setFlyInFrom(null);
      setIsDragging(false);
    } else {
      handleDropCancel();
    }

  }, [setSearchMask]);

  const handlePickup = useCallback((x: number, y: number) => {
    setScreenXY(null);
    setSearchMask(null);
    setPickupPos({ x, y });
    setFlyInFrom(null);
  }, [setSearchMask]);

  const handleDropCancel = useCallback(() => {
    setPickupPos(null);
    setFlyInFrom(null);
  }, []);

  const value = useMemo<BubbleAvatarState>(() => ({
    screenXY,
    pickupPos,
    isDragging,
    beginDragging,
    endDragging,
    isNearHome,
    setIsNearHome,
    flyInFrom,
    resetBubbleToHome,
    handleDropLatLng,
    handleDropXY,
    handlePickup,
    handleDropCancel,
    setScreenXY,
  }), [
    screenXY,
    pickupPos,
    isDragging,
    beginDragging,
    endDragging,
    isNearHome,
    setIsNearHome,
    flyInFrom,
    resetBubbleToHome,
    handleDropLatLng,
    handleDropXY,
    handlePickup,
    handleDropCancel,
  ]);

  return (
    <BubbleAvatarStateContext.Provider value={value}>
      {children}
    </BubbleAvatarStateContext.Provider>
  );
};
