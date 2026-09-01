import { createContext, useContext, useMemo, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { CUISINE_DISPLAY } from '../utils/format/formatCuisines';

export const CUISINE_FILTER_OPTIONS = Object.keys(CUISINE_DISPLAY);
export const PRICE_RANGE_FILTER_OPTIONS = ['<10', '10+', '20+', '40+', '60+', '100+'] as const;
const VENUE_TYPE_FILTER_OPTIONS = ['Dine-In', 'Takeaway'] as const;
const SCORE_TIER_FILTER_OPTIONS = [1, 2, 3, 4] as const;
type CuisineSelectionMode = 'include' | 'exclude';
type VenueTypeFilterOption = (typeof VENUE_TYPE_FILTER_OPTIONS)[number];
type PriceRangeFilterOption = (typeof PRICE_RANGE_FILTER_OPTIONS)[number];
type PriceRangeInterval = [number, number];
type ScoreTierFilterOption = 0 | (typeof SCORE_TIER_FILTER_OPTIONS)[number];
type ScoreBasis = 0 | 1 | 2;
export type SearchMask = { center: { lat: number; lng: number }, radiusM: number };

type SearchFiltersContextType = {
  cuisines: string[]; effectiveCuisines: string[]; 
  addCuisine: (value: string) => void; clearCuisines: () => void;
  cuisineSelectionMode: CuisineSelectionMode; setCuisineSelectionMode: (value: CuisineSelectionMode) => void;
  scoreBasis: ScoreBasis; setScoreBasis: (value: ScoreBasis) => void;
  venueType: VenueTypeFilterOption | null; setVenueType: (value: VenueTypeFilterOption | null) => void;
  priceRangeInterval: PriceRangeInterval | null; setPriceRangeInterval: (value: PriceRangeInterval | null) => void;
  effectivePriceRanges: PriceRangeFilterOption[];
  scoreTier: ScoreTierFilterOption; setScoreTier: (value: ScoreTierFilterOption) => void;
  searchMask: SearchMask | null; setSearchMask: Dispatch<SetStateAction<SearchMask | null>>;
  resetFilters: () => void;
};

const SearchFiltersContext = createContext<SearchFiltersContextType | null>(null);

export const SearchFiltersProvider = ({ children }: { children: ReactNode }) => {
  
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [cuisineSelectionMode, setCuisineSelectionMode] = useState<CuisineSelectionMode>('include');
  const effectiveCuisines = useMemo<string[]>(() => ( cuisineSelectionMode === 'include' 
    ? cuisines : CUISINE_FILTER_OPTIONS.filter((option) => !cuisines.includes(option))
  ), [cuisineSelectionMode, cuisines]);
  const addCuisine = (value: string) => {
    setCuisines((prev) => {
      const next = prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value];
      return [...next].sort((left, right) => left.localeCompare(right));
    });
  };
  const clearCuisines = () => setCuisines([]);

  const [priceRangeInterval, setPriceRangeInterval] = useState<PriceRangeInterval | null>(null);
  const effectivePriceRanges = useMemo<PriceRangeFilterOption[]>(() => {
    if (!priceRangeInterval) return [];
    const [start, end] = priceRangeInterval;
    return PRICE_RANGE_FILTER_OPTIONS.slice(start, end + 1);
  }, [priceRangeInterval]);

  const [venueType, setVenueType] = useState<VenueTypeFilterOption | null>(null);
  const [scoreBasis, setScoreBasis] = useState<ScoreBasis>(2);
  const [scoreTier, setScoreTier] = useState<ScoreTierFilterOption>(2);
  const [searchMask, setSearchMask] = useState<SearchMask | null>(null);

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
    cuisines, effectiveCuisines, addCuisine, clearCuisines,
    cuisineSelectionMode, setCuisineSelectionMode, 
    effectivePriceRanges, priceRangeInterval, setPriceRangeInterval, 
    scoreBasis, setScoreBasis,
    venueType, setVenueType,
    scoreTier, setScoreTier,
    searchMask, setSearchMask,
    resetFilters,
  }), [
    cuisines, effectiveCuisines, addCuisine, clearCuisines,
    cuisineSelectionMode, setCuisineSelectionMode,
    effectivePriceRanges, priceRangeInterval, setPriceRangeInterval,
    scoreBasis, setScoreBasis,
    venueType, setVenueType,
    scoreTier, setScoreTier,
    searchMask, setSearchMask,
    resetFilters,
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