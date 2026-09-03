import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type geojson from 'geojson';

export type InitParams = {
    city: string,
    center: [number, number],
    initZoom: number,
    minZoom: number,
    maxZoom: number,
    maxBounds: [[number, number], [number, number]],
    boundary: geojson.Geometry;
};
type CityContextType = {
  initParams: InitParams | null;
  reportCity: (city: string) => void;
};

const CityContext = createContext<CityContextType | null>(null);

export const CityProvider = ({ children }: { children: ReactNode }) => {
  const [city, setSelectedCity] = useState<string | null>(null);
  const [initParams, setInitParams] = useState<InitParams | null>(null);
  const reportCity = useCallback((city: string) => {
    setSelectedCity(city);

  }, []);

  const value = useMemo<CityContextType>(() => ({
    initParams,
    reportCity
  }), [initParams, reportCity]);

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
};

export const useCityContext = (): CityContextType => {
  const ctx = useContext(CityContext);
  if (!ctx) {
    throw new Error('useCityContext must be used within CityProvider');
  }
  return ctx;
};