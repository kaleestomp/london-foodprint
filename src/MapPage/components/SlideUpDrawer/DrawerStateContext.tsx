import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

interface DrawerState {
    isAtFullHeight: boolean;
    reportIsAtFullHeight: (isAtFullHeight: boolean) => void;
    snap: number | null;
    reportSnap: (snap: number | string | null) => void;
}

const DrawerStateContext = createContext<DrawerState | null>(null);

export const DrawerStateProvider = ({ children }: { children: ReactNode }) => {

    const [isAtFullHeight, setIsAtFullHeight] = useState<boolean>(false);
    const reportIsAtFullHeight = (isAtFullHeight: boolean) => setIsAtFullHeight(isAtFullHeight);
    const [snapPX, setSnapPX] = useState<number | null>(null);
    const reportSnap = (snap: number | string | null) => {
        if (typeof snap === 'number') {
            setSnapPX(window.innerHeight * snap);
        } else if (typeof snap === 'string' && snap.endsWith('px')) {
            setSnapPX(parseFloat(snap));
        } else setSnapPX(null);
    };
    // const [drawerHeight, setDrawerHeight] = useState(0);
    // const reportDrawerHeight = (height: number) => setDrawerHeight(height);
    const exposed = useMemo<DrawerState>(() => ({
        isAtFullHeight, reportIsAtFullHeight, 
        snap: snapPX, reportSnap
    }), [isAtFullHeight, snapPX]);

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
