import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import useIsMobile from '../utils/browser/useIsMobile';

/**
 * Provides a single shared isMobile boolean derived from one useIsMobile()
 * instance. Consumers re-render only when the breakpoint actually flips —
 * not when unrelated AppUI state (loading, toolbar tab, etc.) changes.
 */
const IsMobileContext = createContext<boolean>(false);

export const IsMobileProvider = ({ children }: { children: ReactNode }) => {
  const isMobile = useIsMobile();
  return (
    <IsMobileContext.Provider value={isMobile}>
      {children}
    </IsMobileContext.Provider>
  );
};

export const useIsMobileCtx = (): boolean => useContext(IsMobileContext);
