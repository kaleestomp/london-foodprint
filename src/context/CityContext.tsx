import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type geojson from 'geojson';
import { london, londonBoundary } from '../assets/cityParams/default';

export type CityParams = {
    city: string,
    center: [number, number],
    initZoom: number,
    minZoom: number,
    maxZoom: number,
    maxBounds: [[number, number], [number, number]];
};
type CityContextType = {
  cityParams: CityParams;
  cityBoundary: geojson.FeatureCollection | geojson.Feature | geojson.Geometry | null;
  reportCity: (city: string) => void;
};

const isGeoJSON = (obj: unknown): obj is geojson.FeatureCollection | geojson.Feature | geojson.Geometry => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'type' in obj &&
    typeof (obj as { type: unknown }).type === 'string'
  );
};

const CityContext = createContext<CityContextType | null>(null);

// Registry of available city param modules using Vite import.meta.glob
const cityLoaders = import.meta.glob<Record<string, unknown>>('../assets/cityParams/*.ts');

export const CityProvider = ({ children }: { children: ReactNode }) => {
  const [cityParams, setCityParams] = useState<CityParams>(london);
  const [cityBoundary, setCityBoundary] = useState<geojson.FeatureCollection | geojson.Feature | geojson.Geometry | null>(londonBoundary);

  const reportCity = useCallback((city: string) => {
    const cityName = city.toLowerCase();
    const loader = cityLoaders[`../assets/cityParams/${cityName}.ts`];
    if (!loader) {
      console.warn(`City params for "${city}" not found.`);
      return;
    }

    loader().then((module) => {
      const mod = module as Record<string, unknown>;
      const params = (mod[cityName] ?? mod.default) as CityParams | undefined;
      const rawBoundary = mod[`${cityName}Boundary`] ?? mod.boundary ?? mod.default;

      if (params) {
        setCityParams(params);
      }
      if (isGeoJSON(rawBoundary)) {
        setCityBoundary(rawBoundary);
      }
    })
    .catch((err) => {
      console.error(`Failed to load city params for "${city}":`, err);
    });

  }, []);

  const value = useMemo<CityContextType>(() => ({
    cityParams,
    cityBoundary,
    reportCity
  }), [cityParams, cityBoundary, reportCity]);

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
};

export const useCityContext = (): CityContextType => {
  const ctx = useContext(CityContext);
  if (!ctx) {
    throw new Error('useCityContext must be used within CityProvider');
  }
  return ctx;
};