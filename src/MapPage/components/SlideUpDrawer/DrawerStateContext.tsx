import { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

import { usePlaceSelection } from '../../../context/PlaceSelectionContext';
import { SNAP_HEIGHTS } from './SlideUpDrawer';
import snapToPX from './util/snapToPX';

interface DrawerState {
    snap: number | string | null;
    updateSnap: (newSnap: number | string | null) => void;
    themeColor: string | null;
    reportThemeColor: (color: string | null) => void;
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
    const openDrawer = () => {
        if (isClosed) updateSnap(SNAP_HEIGHTS[1]);
    };
    const [isAtFullHeight, setIsAtFullHeight] = useState<boolean>(false);
    const [isClosed, setIsClosed] = useState<boolean>(true);
    const [snapPX, setSnapPX] = useState<number | null>(snapToPX(SNAP_HEIGHTS[0])); 
    const [themeColor, setThemeColor] = useState<string | null>(null);
    const reportThemeColor = useCallback((color: string | null) => {
        setThemeColor(color);
    }, []);

    // OPEN DRAWER TO HALF (FROM CLOSED)
    // ON SELECTING AN ITEM FROM THE MAP
    const { selectedPlaceId, selectionSource, clearSelection } = usePlaceSelection();
    useEffect(() => {
        const itemSelectedFromMap = selectedPlaceId && selectionSource === 'map';
        if (itemSelectedFromMap && isClosed)
            openDrawer();
    }, [selectedPlaceId]);

    // CLEAR PLACE SELECTION ON DRAWER CLOSED
    // IF PLACE IS SELECTED FROM THE LIST
    useEffect(() => {
        const itemSelectedFromList = selectedPlaceId && selectionSource === 'list';
        if(isClosed && itemSelectedFromList)
            clearSelection();
    }, [isClosed]);

    // EXPOSED STATES
    const exposed = useMemo<DrawerState>(() => ({
        snap, updateSnap, themeColor, reportThemeColor, openDrawer, 
        snapPX, isAtFullHeight, isClosed
    }), [isAtFullHeight, isClosed, snapPX, snap, themeColor, reportThemeColor]);

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
