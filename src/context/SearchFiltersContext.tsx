import { createContext, useContext, useMemo, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';

export const CUISINE_FILTER_OPTIONS = [
  
  'Italian',
  'Mediterranean',
  'Japanese',
  'Korean',
  'Chinese',

  'Bistro',
  'European',
  'African',
  'Asian',
  'Bakery & Pastry',

  'Australian',
  'Bar & Pub',
  'British',
  'Brunch & Breakfast',
  'Buffet',
  'Burgers',
  'Cafe & Coffee',
  'American',
  'Dessert & Ice Cream',
  'Eastern European',
  
  'Family Restaurant',
  'Fast Food',
  'Fine Dining',
  'French',
  'German',
  'Halal',
  'Kebab Shop',
  'Latin American',
  'Middle Eastern',
  'Northern European',
  'Pizza',
  'Sandwich & Deli',
  'Seafood',
  'South Asian',
  'Southeast Asian',
  'Southern European',
  'Steakhouse & BBQ',
  'Tapas',
  'Unspecified',
  'Vegetarian & Vegan',
] as const;

export const VENUE_TYPE_FILTER_OPTIONS = ['Dine-In', 'Takeaway'] as const;
export const PRICE_RANGE_FILTER_OPTIONS = ['<10', '10+', '20+', '40+', '60+', '100+'] as const;
export const SCORE_TIER_FILTER_OPTIONS = [1, 2, 3, 4] as const;

export type CuisineFilterOption = (typeof CUISINE_FILTER_OPTIONS)[number];
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
  cuisines: CuisineFilterOption[];
  cuisineSelectionMode: CuisineSelectionMode;
  scoreBasis: ScoreBasis;
  effectiveCuisines: CuisineFilterOption[];
  venueType: VenueTypeFilterOption | null;
  priceRange: PriceRangeFilterOption | null;
  priceRangeInterval: PriceRangeInterval | null;
  effectivePriceRanges: PriceRangeFilterOption[];
  scoreTier: ScoreTierFilterOption;
  searchMask: SearchMask | null;
  toggleCuisine: (value: CuisineFilterOption) => void;
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
  const [cuisines, setCuisines] = useState<CuisineFilterOption[]>([]);
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

  const exposed = useMemo<SearchFiltersContextType>(() => ({
    cuisines,
    cuisineSelectionMode,
    scoreBasis,
    effectiveCuisines: cuisineSelectionMode === 'include'
      ? cuisines
      : CUISINE_FILTER_OPTIONS.filter((option) => !cuisines.includes(option)),
    venueType,
    priceRange,
    priceRangeInterval,
    effectivePriceRanges,
    scoreTier,
    searchMask,
    toggleCuisine: (value: CuisineFilterOption) => {
      setCuisines((prev) => {
        const next = prev.includes(value)
          ? prev.filter((item) => item !== value)
          : [...prev, value];

        return [...next].sort((left, right) => left.localeCompare(right));
      });
    },
    clearCuisines: () => setCuisines([]),
    setCuisineSelectionMode,
    setScoreBasis,
    setVenueType,
    setPriceRange: (value: PriceRangeFilterOption | null) => {
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
    },
    setPriceRangeInterval,
    setScoreTier,
    setSearchMask,
    resetFilters: () => {
      setCuisines([]);
      setCuisineSelectionMode('include');
      setScoreBasis(2);
      setVenueType(null);
      setPriceRangeInterval(null);
      setScoreTier(2);
      setSearchMask(null);
    },
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