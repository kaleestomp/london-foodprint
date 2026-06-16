import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

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
export const SCORE_TIER_THRESHOLD_MAP = {
  0: 0,
  1: 0.5,
  2: 0.75,
  3: 0.9,
  4: 0.95,
} as const;

export type CuisineFilterOption = (typeof CUISINE_FILTER_OPTIONS)[number];
export type CuisineSelectionMode = 'include' | 'exclude';
export type RatingSelectionMode = 'tier' | 'tier_independent';
export type VenueTypeFilterOption = (typeof VENUE_TYPE_FILTER_OPTIONS)[number];
export type PriceRangeFilterOption = (typeof PRICE_RANGE_FILTER_OPTIONS)[number];
export type ScoreTierFilterOption = 0 | (typeof SCORE_TIER_FILTER_OPTIONS)[number];

type SearchFiltersContextType = {
  cuisines: CuisineFilterOption[];
  cuisineSelectionMode: CuisineSelectionMode;
  ratingSelectionMode: RatingSelectionMode;
  effectiveCuisines: CuisineFilterOption[];
  venueType: VenueTypeFilterOption | null;
  priceRange: PriceRangeFilterOption | null;
  scoreTier: ScoreTierFilterOption;
  toggleCuisine: (value: CuisineFilterOption) => void;
  clearCuisines: () => void;
  setCuisineSelectionMode: (value: CuisineSelectionMode) => void;
  setRatingSelectionMode: (value: RatingSelectionMode) => void;
  setVenueType: (value: VenueTypeFilterOption | null) => void;
  setPriceRange: (value: PriceRangeFilterOption | null) => void;
  setScoreTier: (value: ScoreTierFilterOption) => void;
  resetFilters: () => void;
};

const SearchFiltersContext = createContext<SearchFiltersContextType | null>(null);

export const SearchFiltersProvider = ({ children }: { children: ReactNode }) => {
  const [cuisines, setCuisines] = useState<CuisineFilterOption[]>([]);
  const [cuisineSelectionMode, setCuisineSelectionMode] = useState<CuisineSelectionMode>('include');
  const [ratingSelectionMode, setRatingSelectionMode] = useState<RatingSelectionMode>('tier');
  const [venueType, setVenueType] = useState<VenueTypeFilterOption | null>(null);
  const [priceRange, setPriceRange] = useState<PriceRangeFilterOption | null>(null);
  const [scoreTier, setScoreTier] = useState<ScoreTierFilterOption>(3);

  const exposed = useMemo<SearchFiltersContextType>(() => ({
    cuisines,
    cuisineSelectionMode,
    ratingSelectionMode,
    effectiveCuisines: cuisineSelectionMode === 'include'
      ? cuisines
      : CUISINE_FILTER_OPTIONS.filter((option) => !cuisines.includes(option)),
    venueType,
    priceRange,
    scoreTier,
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
    setRatingSelectionMode,
    setVenueType,
    setPriceRange,
    setScoreTier,
    resetFilters: () => {
      setCuisines([]);
      setCuisineSelectionMode('include');
      setRatingSelectionMode('tier');
      setVenueType(null);
      setPriceRange(null);
      setScoreTier(3);
    },
  }), [cuisineSelectionMode, cuisines, ratingSelectionMode, venueType, priceRange, scoreTier]);

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