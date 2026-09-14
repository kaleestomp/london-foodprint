import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type RenderedListContextValue = {
  unmatchedPlaceId: string | null;
  setUnmatchedPlaceId: (value: string | null) => void;
};

const RenderedListContext = createContext<RenderedListContextValue | null>(null);

export const RenderedListProvider = ({ children }: { children: ReactNode }) => {
  const [unmatchedPlaceId, setUnmatchedPlaceId] = useState<string | null>(null);
  const value = useMemo(() => ({
    unmatchedPlaceId,
    setUnmatchedPlaceId,
  }), [unmatchedPlaceId]);

  return (
    <RenderedListContext.Provider value={value}>
      {children}
    </RenderedListContext.Provider>
  );
};

export const useRenderedList = (): RenderedListContextValue => {
  const context = useContext(RenderedListContext);
  if (!context) {
    throw new Error('useRenderedList must be used within RenderedListProvider');
  }
  return context;
};
