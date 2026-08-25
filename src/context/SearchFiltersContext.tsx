import { createContext, useContext, useMemo, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { CUISINE_DISPLAY } from '../utils/format/formatCuisines';

export const CUISINE_FILTER_OPTIONS = Object.keys(CUISINE_DISPLAY);
export const VENUE_TYPE_FILTER_OPTIONS = ['Dine-In', 'Takeaway'] as const;
export const PRICE_RANGE_FILTER_OPTIONS = ['<10', '10+', '20+', '40+', '60+', '100+'] as const;
export const SCORE_TIER_FILTER_OPTIONS = [1, 2, 3, 4] as const;

// export type CuisineFilterOption = (typeof CUISINE_FILTER_OPTIONS)[number];
export type CuisineSelectionMode = 'include' | 'exclude';
export type VenueTypeFilterOption = (typeof VENUE_TYPE_FILTER_OPTIONS)[number];
export type PriceRangeFilterOption = (typeof PRICE_RANGE_FILTER_OPTIONS)[number];
export type PriceRangeInterval = [number, number];
export type ScoreTierFilterOption = 0 | (typeof SCORE_TIER_FILTER_OPTIONS)[number];
export type ScoreBasis = 0 | 1 | 2;
export type SearchMask = {
  center: { lat: number; lng: number };
  radiusM: number;
};

type SearchFiltersContextType = {
  cuisines: string[];
  cuisineSelectionMode: CuisineSelectionMode;
  scoreBasis: ScoreBasis;
  effectiveCuisines: string[];
  venueType: VenueTypeFilterOption | null;
  priceRange: PriceRangeFilterOption | null;
  priceRangeInterval: PriceRangeInterval | null;
  effectivePriceRanges: PriceRangeFilterOption[];
  scoreTier: ScoreTierFilterOption;
  searchMask: SearchMask | null;
  toggleCuisine: (value: string) => void;
  clearCuisines: () => void;
  setCuisineSelectionMode: (value: CuisineSelectionMode) => void;
  setScoreBasis: (value: ScoreBasis) => void;
  setVenueType: (value: VenueTypeFilterOption | null) => void;
  setPriceRange: (value: PriceRangeFilterOption | null) => void;
  setPriceRangeInterval: (value: PriceRangeInterval | null) => void;
  setScoreTier: (value: ScoreTierFilterOption) => void;
  setSearchMask: Dispatch<SetStateAction<SearchMask | null>>;
  resetFilters: () => void;
};

const SearchFiltersContext = createContext<SearchFiltersContextType | null>(null);

export const SearchFiltersProvider = ({ children }: { children: ReactNode }) => {
  
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [cuisineSelectionMode, setCuisineSelectionMode] = useState<CuisineSelectionMode>('include');
  const [scoreBasis, setScoreBasis] = useState<ScoreBasis>(2);
  const [venueType, setVenueType] = useState<VenueTypeFilterOption | null>(null);
  const [priceRangeInterval, setPriceRangeInterval] = useState<PriceRangeInterval | null>(null);
  const [scoreTier, setScoreTier] = useState<ScoreTierFilterOption>(2);
  const [searchMask, setSearchMask] = useState<SearchMask | null>(null);

  const effectivePriceRanges = useMemo<PriceRangeFilterOption[]>(() => {
    if (!priceRangeInterval) return [];
    const [start, end] = priceRangeInterval;
    return PRICE_RANGE_FILTER_OPTIONS.slice(start, end + 1);
  }, [priceRangeInterval]);

  const priceRange = useMemo<PriceRangeFilterOption | null>(() => {
    if (!priceRangeInterval) return null;
    const [start, end] = priceRangeInterval;
    if (start !== end) return null;
    return PRICE_RANGE_FILTER_OPTIONS[start] ?? null;
  }, [priceRangeInterval]);

  const effectiveCuisines = useMemo<string[]>(() => {
    return cuisineSelectionMode === 'include'
      ? cuisines : CUISINE_FILTER_OPTIONS.filter((option) => !cuisines.includes(option));
  }, [cuisineSelectionMode, cuisines]);

  const toggleCuisine = (value: string) => {
    setCuisines((prev) => {
      const next = prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value];

      return [...next].sort((left, right) => left.localeCompare(right));
    });
  };

  const setPriceRange = (value: PriceRangeFilterOption | null) => {
    if (value === null) {
      setPriceRangeInterval(null);
      return;
    }
    const index = PRICE_RANGE_FILTER_OPTIONS.indexOf(value);
    if (index === -1) {
      setPriceRangeInterval(null);
      return;
    }
    setPriceRangeInterval([index, index]);
  };

  const resetFilters = () => {
    setCuisines([]);
    setCuisineSelectionMode('include');
    setScoreBasis(2);
    setVenueType(null);
    setPriceRangeInterval(null);
    setScoreTier(2);
    setSearchMask(null);
  };

  const exposed = useMemo<SearchFiltersContextType>(() => ({
    cuisines, toggleCuisine, 
    effectiveCuisines, clearCuisines: () => setCuisines([]),
    cuisineSelectionMode, setCuisineSelectionMode,
    scoreBasis, setScoreBasis,
    venueType, setVenueType,
    priceRange, setPriceRange,
    priceRangeInterval, setPriceRangeInterval,
    effectivePriceRanges, 
    scoreTier, setScoreTier,
    searchMask, setSearchMask,
    resetFilters,
  }), [
    cuisineSelectionMode, cuisines,
    scoreBasis, venueType, priceRange,
    priceRangeInterval, effectivePriceRanges,
    scoreTier, searchMask
  ]);

  return (
    <SearchFiltersContext.Provider value={exposed}>
      {children}
    </SearchFiltersContext.Provider>
  );
};

export const useSearchFilters = (): SearchFiltersContextType => {
  const context = useContext(SearchFiltersContext);
  if (!context) throw new Error('useSearchFilters must be used within SearchFiltersProvider');

  return context;
};