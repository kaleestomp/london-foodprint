import { useEffect, useState } from 'react';
import { useSearchFilters } from '../../../../context/SearchFiltersContext';

const TIMEOUT_MS = 1000;

const useFormatPlaceCount = (
  count: number | null
): { subfix: string; subline: string } => {

  const { searchMask, scoreTier } = useSearchFilters();
  const [displayCount, setDisplayCount] = useState<number | null>(count);
  const [showLoading, setShowLoading] = useState(false);
  
  useEffect(() => {
    if (count !== displayCount) {
      setDisplayCount(count);
    }
  }, [count, displayCount]);

  useEffect(() => {
    if (count !== null) {
      setShowLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowLoading(true);
    }, TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [count]);

  // On initialize Load (count === null), or when loading, 
  // show "Searching..." message. Otherwise
  if (showLoading || displayCount === null) {
    return { subfix: 'Searching...', subline: 'for places in the area' };
  } 

  const unit = scoreTier === 4 ? 'Absolute Gem' 
    : scoreTier === 3 ? 'Absolute Gem'
    : scoreTier === 2 ? 'Good Find'
    : scoreTier === 1 ? 'Decent Place'
    : 'Place';
  const subfix = displayCount === 1 ? unit : `${unit}s`;
  const subline = searchMask ? 'within 10 minutes walk' : 'within view';

  return { subfix, subline };

};
export default useFormatPlaceCount;
