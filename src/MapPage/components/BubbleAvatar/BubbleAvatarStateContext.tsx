import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { type LatLng } from './config';

type Point = { x: number; y: number };

interface BubbleAvatarState {
  /** World coordinate where drop off was triggered */
  droppedPos: LatLng | null;

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
  setNearHome: Dispatch<SetStateAction<boolean>>;

  /** Screen coordinate where the button should fly in from when returning home */
  flyInFrom: Point | null;

  /** Reset all floating state to HOME */
  resetBubbleToHome: (from?: Point) => void;

  /** Handle user drop event: set real world coordinates and clear states */
  handleDrop: (lat: number, lng: number) => void;

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
  const [droppedPos, setDroppedPos] = useState<LatLng | null>(null);
  const [pickupPos, setPickupPos] = useState<Point | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isNearHome, setIsNearHome] = useState(false);
  const [flyInFrom, setFlyInFrom] = useState<Point | null>(null);

  const resetBubbleToHome = useCallback((from?: Point) => {
    setDroppedPos(null);
    setPickupPos(null);
    setFlyInFrom(from ?? null);
    setIsDragging(false);
  }, []);

  const beginDragging = useCallback(() => {
    setIsDragging(true);
  }, []);

  const endDragging = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((lat: number, lng: number) => {
    setDroppedPos({ lat, lng });
    setPickupPos(null);
    setFlyInFrom(null);
    setIsDragging(false);
  }, []);

  const handlePickup = useCallback((x: number, y: number) => {
    setDroppedPos(null);
    setPickupPos({ x, y });
    setFlyInFrom(null);
  }, []);

  const handleDropCancel = useCallback(() => {
    setPickupPos(null);
    setFlyInFrom(null);
  }, []);

  const value = useMemo<BubbleAvatarState>(() => ({
    droppedPos,
    pickupPos,
    isDragging,
    beginDragging,
    endDragging,
    isNearHome,
    setNearHome: setIsNearHome,
    flyInFrom,
    resetBubbleToHome,
    handleDrop,
    handlePickup,
    handleDropCancel,
  }), [
    droppedPos,
    pickupPos,
    isDragging,
    beginDragging,
    endDragging,
    isNearHome,
    setIsNearHome,
    flyInFrom,
    resetBubbleToHome,
    handleDrop,
    handlePickup,
    handleDropCancel,
  ]);

  return (
    <BubbleAvatarStateContext.Provider value={value}>
      {children}
    </BubbleAvatarStateContext.Provider>
  );
};
