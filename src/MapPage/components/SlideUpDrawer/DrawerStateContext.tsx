import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

interface DrawerState {
    drawerHeight: number;
    reportDrawerHeight: (height: number) => void;
}

const DrawerStateContext = createContext<DrawerState | null>(null);

export const DrawerStateProvider = ({ children }: { children: ReactNode }) => {
    
    const [drawerHeight, setDrawerHeight] = useState(0);
    const reportDrawerHeight = (height: number) => setDrawerHeight(height);
    const exposed = useMemo<DrawerState>(() => ({
        drawerHeight,
        reportDrawerHeight
    }), [drawerHeight]);

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
