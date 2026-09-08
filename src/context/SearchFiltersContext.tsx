import { createContext, useContext, useMemo, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { CUISINE_DISPLAY } from '../utils/format/formatCuisines';

export const CUISINE_FILTER_OPTIONS = Object.keys(CUISINE_DISPLAY);
export const PRICE_RANGE_FILTER_OPTIONS = ['<10', '10+', '20+', '40+', '60+', '100+'] as const;
type CuisineSelectionMode = 'include' | 'exclude';
type VenueTypeFilterOption = 'Dine-In' | 'Takeaway';
type PriceRangeFilterOption = (typeof PRICE_RANGE_FILTER_OPTIONS)[number];
type PriceRangeInterval = [number, number];
type WilsonBasis = 0 | 1 | 2; // 0: pro-rating, 1: balanced, 2: pro-traffic
type TierOptions = 0 | 1 | 2 | 3 | 4; // 100% 50% 25% 10% 5%
type TierBasis = 0 | 1 | 2; // 0: standard, 1: diversity cap, 2: diversity + no major chain
export type SearchMask = { center: { lat: number; lng: number }, radiusM: number };

type SearchFiltersContextType = {
  cuisines: string[]; effectiveCuisines: string[]; 
  addCuisine: (value: string) => void; clearCuisines: () => void;
  cuisineSelectionMode: CuisineSelectionMode; setCuisineSelectionMode: (value: CuisineSelectionMode) => void;
  venueType: VenueTypeFilterOption | null; setVenueType: (value: VenueTypeFilterOption | null) => void;
  priceRangeInterval: PriceRangeInterval | null; setPriceRangeInterval: (value: PriceRangeInterval | null) => void;
  effectivePriceRanges: PriceRangeFilterOption[];
  searchMask: SearchMask | null; setSearchMask: Dispatch<SetStateAction<SearchMask | null>>;

  scoreBasis: TierBasis; reportScoreBasis: (value: TierBasis) => void;
  scoreTier: TierOptions; setScoreTier: (value: TierOptions) => void;
  wilsonBasis: WilsonBasis; setWilsonBasis: (value: WilsonBasis) => void;
  allowBlockChain: boolean; setAllowBlockChain: (value: boolean) => void;
  allowChain: boolean; setAllowChain: (value: boolean) => void;
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
  const [searchMask, setSearchMask] = useState<SearchMask | null>(null);

  const [scoreBasis, setScoreBasis] = useState<TierBasis>(2); // 0: Tier 1: Diversity, 2: No Block Chain
  const [scoreTier, setScoreTier] = useState<TierOptions>(2);
  const [wilsonBasis, setWilsonBasis] = useState<WilsonBasis>(2);
  const [allowChain, setAllowChain] = useState<boolean>(true);
  const [allowBlockChain, setAllowBlockChain] = useState<boolean>(false);
  const reportScoreBasis = (value: TierBasis) => {
    setScoreBasis(value);
  };

  const resetFilters = () => {
    setCuisines([]);
    setCuisineSelectionMode('include');
    setVenueType(null);
    setPriceRangeInterval(null);
    setSearchMask(null);

    setScoreBasis(2);
    setScoreTier(2);
    setWilsonBasis(1);
    setAllowChain(true);
    setAllowBlockChain(false);
  };

  const exposed = useMemo<SearchFiltersContextType>(() => ({
    cuisines, effectiveCuisines, addCuisine, clearCuisines,
    cuisineSelectionMode, setCuisineSelectionMode, 
    effectivePriceRanges, priceRangeInterval, setPriceRangeInterval, 
    venueType, setVenueType,
    searchMask, setSearchMask,

    scoreBasis, reportScoreBasis,
    scoreTier, setScoreTier,
    wilsonBasis, setWilsonBasis,
    allowChain, setAllowChain,
    allowBlockChain, setAllowBlockChain,
    resetFilters,
  }), [
    cuisines, effectiveCuisines, addCuisine, clearCuisines,
    cuisineSelectionMode, setCuisineSelectionMode, 
    effectivePriceRanges, priceRangeInterval, setPriceRangeInterval, 
    venueType, setVenueType,
    searchMask, setSearchMask,

    scoreBasis, reportScoreBasis,
    scoreTier, setScoreTier,
    wilsonBasis, setWilsonBasis,
    allowChain, setAllowChain,
    allowBlockChain, setAllowBlockChain,
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