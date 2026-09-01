import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { SNAP_HEIGHTS } from './SlideUpDrawer';
import snapToPX from './util/snapToPX';

interface DrawerState {
    snap: number | string | null;
    updateSnap: (newSnap: number | string | null) => void;
    openDrawer: () => void;
    snapPX: number | null;
    isAtFullHeight: boolean;
    isClosed: boolean;
}

const DrawerStateContext = createContext<DrawerState | null>(null);

export const DrawerStateProvider = ({ children }: { children: ReactNode }) => {

    const [snap, setSnap] = useState<number | string | null>(SNAP_HEIGHTS[0]);
    const updateSnap = (newSnap: number | string | null) => {
        setSnap(newSnap);
        setIsAtFullHeight(newSnap === SNAP_HEIGHTS[2]);
        setIsClosed(newSnap === SNAP_HEIGHTS[0]);
        setSnapPX(snapToPX(newSnap));
    };
    const openDrawer = () => updateSnap(SNAP_HEIGHTS[1]);
    const [isAtFullHeight, setIsAtFullHeight] = useState<boolean>(false);
    const [isClosed, setIsClosed] = useState<boolean>(true);
    const [snapPX, setSnapPX] = useState<number | null>(null); 
    // const [drawerHeight, setDrawerHeight] = useState(0);
    // const reportDrawerHeight = (height: number) => setDrawerHeight(height);
    const exposed = useMemo<DrawerState>(() => ({
        snap, updateSnap, openDrawer,
        snapPX, isAtFullHeight, isClosed
    }), [isAtFullHeight, isClosed, snapPX, snap]);

    return (
        <DrawerStateContext.Provider value={exposed}>
            {children}
        </DrawerStateContext.Provider>
    );
};

export const useDrawerState = () => {
    const context = useContext(DrawerStateContext);
    if (!context) {
        throw new Error('useDrawerState must be used within a DrawerStateProvider');
    }
    return context;
};
