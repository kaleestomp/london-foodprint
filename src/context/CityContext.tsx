import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import type geojson from 'geojson';
import londonJson from '../assets/cityParams/london.json';

export type cityOptions = 'london' | 'newcastle';
export type CityParams = {
    display_name: string,  // human-readable display name (e.g. "London", "Newcastle upon Tyne")
    center: [number, number],
    initZoom: number,
    minZoom: number,
    maxZoom: number,
    maxBounds: [[number, number], [number, number]];
};
type CityContextType = {
  citySlug: cityOptions;
  cityParams: CityParams;
  cityBoundary: geojson.FeatureCollection | geojson.Feature | geojson.Geometry | null;
  reportCity: (city: cityOptions) => void;
};

// Raw GeoJSON properties shape for a city (from cityParams/*.json)
type CityGeoProps = {
  display_name?: string;
  center?: [number, number];
  initZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  maxBounds?: [[number, number], [number, number]];
};

const toCityParams = (fc: geojson.FeatureCollection, slug: string): CityParams => {
  const props: CityGeoProps = fc.features?.[0]?.properties ?? {};
  return {
    display_name: props.display_name ?? slug,
    center: props.center ?? [0, 0],
    initZoom: props.initZoom ?? 12,
    minZoom: props.minZoom ?? 10,
    maxZoom: props.maxZoom ?? 20,
    maxBounds: props.maxBounds ?? [[-180, -90], [180, 90]],
  };
};

const CityContext = createContext<CityContextType | null>(null);

// Registry of available city boundary JSON via Vite import.meta.glob
const cityLoaders = import.meta.glob<{ default: geojson.FeatureCollection }>('../assets/cityParams/*.json');

const cityPathSlugs: Record<string, cityOptions> = {
  '/london-foodprint': 'london',
  '/newcastle-foodprint': 'newcastle',
};

const citySlugFromPath = (pathname: string): cityOptions => {
  const normalizedPath = pathname.replace(/\/$/, '').toLowerCase() || '/';
  return cityPathSlugs[normalizedPath] ?? 'london';
};

// Default city feature collection for London
const londonFc = londonJson as geojson.FeatureCollection;

export const CityProvider = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const [citySlug, setCitySlug] = useState<cityOptions>('london');
  const [cityParams, setCityParams] = useState<CityParams>(() => toCityParams(londonFc, 'london'));
  const [cityBoundary, setCityBoundary] = useState<geojson.FeatureCollection | null>(londonFc);

  const reportCity = useCallback((city: cityOptions) => {
    const cityName = city.toLowerCase();
    const loader = cityLoaders[`../assets/cityParams/${cityName}.json`];
    if (!loader) {
      console.warn(`City params for "${city}" not found.`);
      return;
    }

    loader().then(({ default: fc }) => {
      setCityParams(toCityParams(fc, cityName));
      setCityBoundary(fc);
      setCitySlug(cityName as cityOptions);
    })
    .catch((err) => {
      console.error(`Failed to load city params for "${city}":`, err);
    });

  }, []);

  useEffect(() => {
    const requestedCity = citySlugFromPath(pathname);
    if (requestedCity !== citySlug) {
      reportCity(requestedCity);
    }
  }, [citySlug, pathname, reportCity]);

  const value = useMemo<CityContextType>(() => ({
    citySlug, cityParams, cityBoundary, reportCity
  }), [citySlug, cityParams, cityBoundary, reportCity]);

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
};

export const useCityContext = (): CityContextType => {
  const ctx = useContext(CityContext);
  if (!ctx) {
    throw new Error('useCityContext must be used within CityProvider');
  }
  return ctx;
};